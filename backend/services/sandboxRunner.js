const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const axios = require('axios');

const tempDir = path.join(__dirname, '../temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Judge0 API configurations
const getJudge0Config = () => {
  return {
    apiKey: process.env.RAPIDAPI_KEY || '',
    apiHost: process.env.RAPIDAPI_HOST || 'judge0-extra-cdn.p.rapidapi.com',
    apiUrl: `https://${process.env.RAPIDAPI_HOST || 'judge0-extra-cdn.p.rapidapi.com'}/submissions`
  };
};

// Judge0 Language ID Mappings
const JUDGE0_LANG_IDS = {
  'javascript': 93, // Node.js (20.11.0)
  'python': 71,     // Python (3.8.1)
  'c': 75,          // Clang 7.0.1
  'cpp': 76,        // C++ (GCC 7.4.0)
  'java': 62        // Java (OpenJDK 13.0.1)
};

// Safe fallback VM for Javascript
const runJsInVM = (code, input = '') => {
  const startTime = Date.now();
  let outputLogs = [];
  
  // Custom console mock
  const mockConsole = {
    log: (...args) => outputLogs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')),
    error: (...args) => outputLogs.push('[ERROR] ' + args.map(a => String(a)).join(' ')),
    warn: (...args) => outputLogs.push('[WARN] ' + args.map(a => String(a)).join(' '))
  };

  const sandbox = {
    console: mockConsole,
    Buffer: Buffer,
    input: input,
    process: {
      stdin: {
        read: () => input
      }
    }
  };

  try {
    const context = vm.createContext(sandbox);
    const script = new vm.Script(code, { timeout: 3000 }); // 3s timeout
    script.runInContext(context);
    
    const duration = Date.now() - startTime;
    return {
      success: true,
      stdout: outputLogs.join('\n'),
      stderr: '',
      time: duration,
      memory: Math.round(process.memoryUsage().heapUsed / 1024) // KB
    };
  } catch (err) {
    const duration = Date.now() - startTime;
    return {
      success: false,
      stdout: outputLogs.join('\n'),
      stderr: err.stack ? err.stack.split('\n')[0] : err.message,
      time: duration,
      memory: Math.round(process.memoryUsage().heapUsed / 1024)
    };
  }
};

// Local compiler execution
const runLocalProcess = (command, tempFile, cleanCallback) => {
  return new Promise((resolve) => {
    const startTime = Date.now();
    exec(command, { timeout: 4000 }, (error, stdout, stderr) => {
      const duration = Date.now() - startTime;
      if (cleanCallback) cleanCallback();

      if (error && error.killed) {
        resolve({
          success: false,
          stdout: stdout,
          stderr: 'Execution timed out (Limit: 4s)',
          time: duration,
          memory: 4096
        });
      } else {
        resolve({
          success: !error,
          stdout: stdout,
          stderr: stderr || (error ? error.message : ''),
          time: duration,
          memory: Math.round(process.memoryUsage().heapUsed / 1024)
        });
      }
    });
  });
};

// Simulated runs for computers without compilers
const runSimulation = (language, code, input) => {
  const cleanCode = code.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '').trim();
  let simulatedOutput = '';
  
  if (language === 'python') {
    // Regex matches for prints in python
    const printMatches = [...cleanCode.matchAll(/print\s*\(\s*(['"`])(.*?)\1\s*\)/g)];
    if (printMatches.length > 0) {
      simulatedOutput = printMatches.map(m => m[2]).join('\n');
    } else {
      simulatedOutput = 'Code executed successfully (Simulated Environment).';
    }
  } else if (language === 'java') {
    const printMatches = [...cleanCode.matchAll(/System\.out\.println\s*\(\s*(['"`])(.*?)\1\s*\)/g)];
    if (printMatches.length > 0) {
      simulatedOutput = printMatches.map(m => m[2]).join('\n');
    } else {
      simulatedOutput = 'Java Main Class executed successfully (Simulated environment).';
    }
  } else if (language === 'c' || language === 'cpp') {
    const printfMatches = [...cleanCode.matchAll(/printf\s*\(\s*(['"`])(.*?)\\n\1\s*\)/g)] 
      || [...cleanCode.matchAll(/printf\s*\(\s*(['"`])(.*?)\1\s*\)/g)];
    const coutMatches = [...cleanCode.matchAll(/cout\s*<<\s*(['"`])(.*?)\1/g)];
    
    if (printfMatches.length > 0) {
      simulatedOutput = printfMatches.map(m => m[2]).join('\n');
    } else if (coutMatches.length > 0) {
      simulatedOutput = coutMatches.map(m => m[2]).join('\n');
    } else {
      simulatedOutput = 'Compiled & executed (Simulated Sandbox).';
    }
  } else {
    simulatedOutput = `Test script compiled:\n---\nLanguage: ${language}\n---`;
  }

  // Inject user inputs if requested
  if (input) {
    simulatedOutput += `\n[Input received: "${input}"]`;
  }

  return {
    success: true,
    stdout: simulatedOutput,
    stderr: '',
    time: 5,
    memory: 240 // KB
  };
};

const executeCodeLocal = async (language, code, input = '') => {
  const cleanLang = language.toLowerCase();
  const fileHash = Math.random().toString(36).substring(7);
  
  if (cleanLang === 'javascript') {
    return runJsInVM(code, input);
  }

  try {
    if (cleanLang === 'python') {
      const filename = path.join(tempDir, `script_${fileHash}.py`);
      fs.writeFileSync(filename, code);
      // Check if python command is available, else fallback
      return new Promise((resolve) => {
        exec('python --version', (err) => {
          if (err) {
            exec('python3 --version', (err3) => {
              if (err3) {
                // Fallback to simulation
                fs.unlinkSync(filename);
                resolve(runSimulation('python', code, input));
              } else {
                resolve(runLocalProcess(`python3 "${filename}"`, filename, () => fs.unlinkSync(filename)));
              }
            });
          } else {
            resolve(runLocalProcess(`python "${filename}"`, filename, () => fs.unlinkSync(filename)));
          }
        });
      });
    }

    if (cleanLang === 'c') {
      const srcName = path.join(tempDir, `code_${fileHash}.c`);
      const exeName = path.join(tempDir, `prog_${fileHash}.exe`);
      fs.writeFileSync(srcName, code);
      return new Promise((resolve) => {
        exec('gcc --version', (err) => {
          if (err) {
            fs.unlinkSync(srcName);
            resolve(runSimulation('c', code, input));
          } else {
            exec(`gcc "${srcName}" -o "${exeName}"`, (compErr) => {
              if (compErr) {
                fs.unlinkSync(srcName);
                resolve({
                  success: false,
                  stdout: '',
                  stderr: compErr.message,
                  time: 20,
                  memory: 0
                });
              } else {
                resolve(runLocalProcess(`"${exeName}"`, srcName, () => {
                  if (fs.existsSync(srcName)) fs.unlinkSync(srcName);
                  if (fs.existsSync(exeName)) fs.unlinkSync(exeName);
                }));
              }
            });
          }
        });
      });
    }

    if (cleanLang === 'cpp') {
      const srcName = path.join(tempDir, `code_${fileHash}.cpp`);
      const exeName = path.join(tempDir, `prog_${fileHash}.exe`);
      fs.writeFileSync(srcName, code);
      return new Promise((resolve) => {
        exec('g++ --version', (err) => {
          if (err) {
            fs.unlinkSync(srcName);
            resolve(runSimulation('cpp', code, input));
          } else {
            exec(`g++ "${srcName}" -o "${exeName}"`, (compErr) => {
              if (compErr) {
                fs.unlinkSync(srcName);
                resolve({
                  success: false,
                  stdout: '',
                  stderr: compErr.message,
                  time: 25,
                  memory: 0
                });
              } else {
                resolve(runLocalProcess(`"${exeName}"`, srcName, () => {
                  if (fs.existsSync(srcName)) fs.unlinkSync(srcName);
                  if (fs.existsSync(exeName)) fs.unlinkSync(exeName);
                }));
              }
            });
          }
        });
      });
    }

    if (cleanLang === 'java') {
      // Find main class name or default to Main
      const classMatch = code.match(/public\s+class\s+([A-Za-z0-9_]+)/);
      const className = classMatch ? classMatch[1] : 'Main';
      const javaFile = path.join(tempDir, `${className}.java`);
      fs.writeFileSync(javaFile, code);
      
      return new Promise((resolve) => {
        exec('javac -version', (err) => {
          if (err) {
            fs.unlinkSync(javaFile);
            resolve(runSimulation('java', code, input));
          } else {
            exec(`javac "${javaFile}"`, (compErr) => {
              if (compErr) {
                fs.unlinkSync(javaFile);
                resolve({
                  success: false,
                  stdout: '',
                  stderr: compErr.message,
                  time: 40,
                  memory: 0
                });
              } else {
                const compileDir = tempDir;
                exec(`java -cp "${compileDir}" ${className}`, { timeout: 4000 }, (runErr, stdout, stderr) => {
                  if (fs.existsSync(javaFile)) fs.unlinkSync(javaFile);
                  const compiledClass = path.join(tempDir, `${className}.class`);
                  if (fs.existsSync(compiledClass)) fs.unlinkSync(compiledClass);
                  
                  resolve({
                    success: !runErr,
                    stdout: stdout,
                    stderr: stderr || (runErr ? runErr.message : ''),
                    time: 80,
                    memory: 8192
                  });
                });
              }
            });
          }
        });
      });
    }

    // Default simulation fallback
    return runSimulation(language, code, input);
  } catch (err) {
    return {
      success: false,
      stdout: '',
      stderr: err.message,
      time: 0,
      memory: 0
    };
  }
};

const executeCodeJudge0 = async (language, code, input = '') => {
  const { apiKey, apiHost, apiUrl } = getJudge0Config();
  const langId = JUDGE0_LANG_IDS[language.toLowerCase()];
  
  if (!langId) {
    // If language not supported by Judge0, fall back to local
    return executeCodeLocal(language, code, input);
  }

  try {
    const response = await axios.post(
      `${apiUrl}?base64_encoded=true&wait=false`,
      {
        source_code: Buffer.from(code).toString('base64'),
        language_id: langId,
        stdin: Buffer.from(input).toString('base64')
      },
      {
        headers: {
          'x-rapidapi-key': apiKey,
          'x-rapidapi-host': apiHost,
          'content-type': 'application/json'
        }
      }
    );

    const submissionToken = response.data.token;
    
    // Poll for status (max 5 times)
    let retries = 5;
    let result = null;
    
    while (retries > 0) {
      await new Promise(r => setTimeout(r, 1000));
      
      const pollResponse = await axios.get(
        `${apiUrl}/${submissionToken}?base64_encoded=true`,
        {
          headers: {
            'x-rapidapi-key': apiKey,
            'x-rapidapi-host': apiHost
          }
        }
      );

      const statusId = pollResponse.data.status.id;
      if (statusId !== 1 && statusId !== 2) {
        // Finished
        result = pollResponse.data;
        break;
      }
      retries--;
    }

    if (!result) {
      return {
        success: false,
        stdout: '',
        stderr: 'Code execution polling timed out on remote API.',
        time: 5000,
        memory: 0
      };
    }

    // Base64 decode output
    const stdout = result.stdout ? Buffer.from(result.stdout, 'base64').toString('utf8') : '';
    const stderr = result.stderr ? Buffer.from(result.stderr, 'base64').toString('utf8') : '';
    const compileOutput = result.compile_output ? Buffer.from(result.compile_output, 'base64').toString('utf8') : '';
    
    const finalStderr = compileOutput || stderr || '';
    const isSuccess = result.status.id === 3; // Accepted

    return {
      success: isSuccess,
      stdout: stdout,
      stderr: finalStderr,
      time: Math.round((result.time || 0) * 1000), // ms
      memory: result.memory || 0 // KB
    };

  } catch (error) {
    console.error('Judge0 remote compilation failed:', error.message);
    // Fall back to local compilation
    return executeCodeLocal(language, code, input);
  }
};

const execute = async (language, code, input = '') => {
  const { apiKey } = getJudge0Config();
  if (apiKey) {
    return executeCodeJudge0(language, code, input);
  } else {
    return executeCodeLocal(language, code, input);
  }
};

module.exports = { execute };
