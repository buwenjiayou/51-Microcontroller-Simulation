
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { State, User, FingerprintResult, LogEntry } from './types';
import { ADMIN_PASSWORD, MAX_USERS, LOCK_TIME_SEC, UNLOCK_HOLD_SEC } from './constants';
import { LCD } from './components/LCD';
import { Keypad } from './components/Keypad';

const App: React.FC = () => {
  // --- Simulation State ---
  const [currentState, setCurrentState] = useState<State>(State.STATE4_STANDBY);
  const [errorCount, setErrorCount] = useState(0);
  const [users, setUsers] = useState<User[]>([]);
  const [passwordBuffer, setPasswordBuffer] = useState('');
  const [lockTimer, setLockTimer] = useState(0);
  const [unlockTimer, setUnlockTimer] = useState(0);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [fingerprintSimResult, setFingerprintSimResult] = useState<FingerprintResult>('match');
  const [simulatedFingerId, setSimulatedFingerId] = useState(1);
  const [motorState, setMotorState] = useState(false);
  const [buzzerActive, setBuzzerActive] = useState(false);
  const [adminOption, setAdminOption] = useState<number | null>(null);

  const timerRef = useRef<number | null>(null);

  // --- Clock logic (DS1302 simulation) ---
  useEffect(() => {
    const interval = setInterval(() => setCurrentDate(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // --- Logger ---
  const addLog = useCallback((event: string, state: string) => {
    const newLog: LogEntry = {
      timestamp: new Date().toLocaleTimeString(),
      event,
      state,
      errorCount,
    };
    setLogs(prev => [newLog, ...prev].slice(0, 50));
  }, [errorCount]);

  // --- State Machine Helpers ---
  const transitionTo = useCallback((newState: State, reason: string) => {
    addLog(`Transition: ${reason}`, newState);
    setCurrentState(newState);
    setPasswordBuffer('');
    setAdminOption(null);
  }, [addLog]);

  // --- Lockout Timer ---
  useEffect(() => {
    if (lockTimer > 0) {
      const interval = setInterval(() => {
        setLockTimer(prev => {
          if (prev <= 1) {
            transitionTo(State.STATE4_STANDBY, 'Lockout ended');
            setErrorCount(0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [lockTimer, transitionTo]);

  // --- Unlock Timer ---
  useEffect(() => {
    if (unlockTimer > 0) {
      setMotorState(true);
      const interval = setInterval(() => {
        setUnlockTimer(prev => {
          if (prev <= 1) {
            setMotorState(false);
            transitionTo(State.STATE4_STANDBY, 'Door auto-locked');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [unlockTimer, transitionTo]);

  // --- Peripheral Actions ---
  const triggerBuzzer = (type: 'beep' | 'ding-dong') => {
    setBuzzerActive(true);
    addLog(`Buzzer: ${type}`, currentState);
    setTimeout(() => setBuzzerActive(false), type === 'beep' ? 200 : 1000);
  };

  const handleError = useCallback(() => {
    triggerBuzzer('beep');
    const newCount = errorCount + 1;
    setErrorCount(newCount);
    if (newCount >= 3) {
      transitionTo(State.STATE_LOCKED, 'Exceeded max errors');
      setLockTimer(LOCK_TIME_SEC);
    }
  }, [errorCount, currentState, transitionTo]);

  // --- Input Handlers ---
  const handleKey = (key: number) => {
    if (currentState === State.STATE_LOCKED) return;

    if (currentState === State.STATE0_INPUT) {
      if (passwordBuffer.length < 6) {
        setPasswordBuffer(prev => prev + key);
      }
    } else if (currentState === State.STATE1_ADMIN) {
      if (key >= 1 && key <= 5) {
        setAdminOption(key);
      }
    } else if (currentState === State.STATE3_ADD_USER) {
      if (passwordBuffer.length < 6) {
        setPasswordBuffer(prev => prev + key);
      }
    }
  };

  const handleOk = () => {
    if (currentState === State.STATE4_STANDBY) {
      transitionTo(State.STATE0_INPUT, 'User wants to unlock');
    } 
    else if (currentState === State.STATE0_INPUT) {
      if (passwordBuffer.length < 6) {
        addLog('Short password attempted', currentState);
        setPasswordBuffer('');
        handleError();
      } else {
        if (passwordBuffer === ADMIN_PASSWORD) {
          setErrorCount(0);
          transitionTo(State.STATE1_ADMIN, 'Admin login');
        } else {
          const user = users.find(u => u.password === passwordBuffer);
          if (user) {
            setErrorCount(0);
            setUnlockTimer(UNLOCK_HOLD_SEC);
            transitionTo(State.STATE2_UNLOCK, 'User unlock');
          } else {
            handleError();
            setPasswordBuffer('');
          }
        }
      }
    }
    else if (currentState === State.STATE_FINGERPRINT) {
      // Simulate Capture + Search
      if (fingerprintSimResult === 'match') {
        setErrorCount(0);
        transitionTo(State.STATE_FINGERPRINT, 'Capture SUCCESS');
        setTimeout(() => transitionTo(State.STATE0_INPUT, 'Finger logic done'), 10000);
      } else {
        handleError();
        transitionTo(State.STATE_FINGERPRINT, 'Capture FAILED');
        setTimeout(() => transitionTo(State.STATE0_INPUT, 'Finger error done'), 10000);
      }
    }
    else if (currentState === State.STATE1_ADMIN) {
      if (adminOption === 1) transitionTo(State.STATE3_ADD_USER, 'Add password');
      if (adminOption === 2) {
        addLog('Fingerprint database cleared', currentState);
        transitionTo(State.STATE0_INPUT, 'Database clear done');
      }
      if (adminOption === 3) {
        setUsers([]);
        addLog('All passwords deleted', currentState);
        transitionTo(State.STATE0_INPUT, 'Delete done');
      }
      if (adminOption === 4) {
        addLog('Add fingerprint simulation start', currentState);
        transitionTo(State.STATE0_INPUT, 'Add finger done');
      }
      if (adminOption === 5) {
        addLog('Viewing logs in browser', currentState);
      }
    }
    else if (currentState === State.STATE3_ADD_USER) {
      if (passwordBuffer.length === 6) {
        if (users.length >= MAX_USERS) {
          transitionTo(State.STATE1_ADMIN, 'User list full');
        } else {
          setUsers(prev => [...prev, { id: prev.length + 1, password: passwordBuffer }]);
          addLog(`Added User ${users.length + 1}`, currentState);
          transitionTo(State.STATE1_ADMIN, 'Password added');
        }
      } else {
        addLog('Password too short', currentState);
        transitionTo(State.STATE1_ADMIN, 'Canceled: insufficient length');
      }
    }
  };

  const handleCancel = () => {
    if (currentState === State.STATE4_STANDBY) {
      triggerBuzzer('ding-dong');
    } else if (currentState === State.STATE0_INPUT) {
      setPasswordBuffer('');
    } else if (currentState === State.STATE1_ADMIN) {
      transitionTo(State.STATE0_INPUT, 'Exited admin');
    } else if (currentState === State.STATE3_ADD_USER) {
      transitionTo(State.STATE1_ADMIN, 'Add Canceled');
    } else if (currentState === State.STATE_FINGERPRINT) {
      transitionTo(State.STATE0_INPUT, 'Finger Canceled');
    }
  };

  const handleS16 = () => {
    if (currentState === State.STATE0_INPUT) {
      transitionTo(State.STATE_FINGERPRINT, 'Switch to fingerprint');
    }
  };

  // --- LCD Logic ---
  const getLCDLines = (): string[] => {
    switch (currentState) {
      case State.STATE4_STANDBY:
        return [
          '****智能门锁****',
          `日期: ${currentDate.toISOString().slice(2, 10)}`,
          `时间: ${currentDate.toLocaleTimeString('zh-CN', { hour12: false })}`,
          '按OK解锁或按门铃'
        ];
      case State.STATE0_INPUT:
        return [
          '指纹密码锁',
          '请输入密码:',
          passwordBuffer.padEnd(6, '_'),
          'S16:使用指纹解锁'
        ];
      case State.STATE1_ADMIN:
        return [
          '1.增加密码',
          '2.清空指纹库',
          '3.删去密码',
          '4.添加指纹',
          adminOption ? `已选: ${adminOption}` : ''
        ].slice(0, 4);
      case State.STATE2_UNLOCK:
        return [
          '欢迎使用',
          '电机开锁中...',
          `剩余时间: ${unlockTimer}s`,
          ''
        ];
      case State.STATE3_ADD_USER:
        if (users.length >= MAX_USERS) return ['用户已满', '', '', ''];
        return [
          '输入新密码:',
          '*'.repeat(passwordBuffer.length),
          '',
          ''
        ];
      case State.STATE_LOCKED:
        return [
          '错误大于3 次',
          '锁定1 分钟',
          `倒计时: ${lockTimer}s`,
          ''
        ];
      case State.STATE_FINGERPRINT:
        if (logs[0]?.event.includes('Capture SUCCESS')) {
            return ['欢迎使用', '', `ID:${simulatedFingerId}`, ''];
        }
        if (logs[0]?.event.includes('Capture FAILED')) {
            return ['指纹密码错误', '', '', ''];
        }
        return [
          '请输入指纹',
          '',
          '按OK开始识别',
          ''
        ];
      default:
        return ['', '', '', ''];
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 gap-8">
      <header className="text-center space-y-4">
        <div className="relative inline-block">
          <h1 className="text-4xl md:text-5xl font-black tech-style">
            布文出品，必属精品
            <div className="tech-scanner"></div>
          </h1>
        </div>
        <p className="text-xl md:text-2xl mech-style">51单片机+指纹模块+12864显示+蜂鸣器+功率放大芯片+直流门锁</p>
      </header>

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left: LCD and Input */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <LCD 
            lines={getLCDLines()} 
            stateId={currentState} 
            step={passwordBuffer.length > 0 ? `Len:${passwordBuffer.length}` : undefined}
          />
          <Keypad 
            onKey={handleKey} 
            onOk={handleOk} 
            onCancel={handleCancel} 
            onS16={handleS16}
            disabled={currentState === State.STATE_LOCKED || currentState === State.STATE2_UNLOCK}
          />
        </div>

        {/* Center/Right: Peripherals & Simulation Controls */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
              外设与仿真配置
            </h2>
            
            <div className="space-y-6">
              {/* Fingerprint Simulator */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">指纹模块模拟设置</label>
                <div className="flex flex-wrap gap-2">
                  {(['match', 'no_match', 'no_finger', 'error'] as FingerprintResult[]).map(res => (
                    <button
                      key={res}
                      onClick={() => setFingerprintSimResult(res)}
                      className={`px-3 py-1.5 text-xs rounded-full border transition-all ${fingerprintSimResult === res ? 'bg-blue-500 text-white border-blue-600' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
                    >
                      {res === 'match' ? '合法指纹' : res === 'no_match' ? '未知指纹' : res === 'no_finger' ? '无手指' : '采集异常'}
                    </button>
                  ))}
                </div>
                {fingerprintSimResult === 'match' && (
                  <div className="mt-3 flex items-center gap-3">
                    <span className="text-xs text-slate-500">模拟ID (0-255):</span>
                    <input 
                      type="range" min="0" max="255" value={simulatedFingerId} 
                      onChange={(e) => setSimulatedFingerId(parseInt(e.target.value))}
                      className="flex-1 accent-blue-500"
                    />
                    <span className="text-xs font-mono font-bold">{simulatedFingerId}</span>
                  </div>
                )}
              </div>

              {/* Status Visuals */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col items-center justify-center gap-2">
                  <span className="text-xs text-slate-500 uppercase tracking-tighter">Motor State</span>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${motorState ? 'bg-emerald-100 text-emerald-600 animate-spin' : 'bg-slate-200 text-slate-400'}`}>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path></svg>
                  </div>
                  <span className={`text-[10px] font-bold ${motorState ? 'text-emerald-600' : 'text-slate-400'}`}>{motorState ? 'ON (OPEN)' : 'OFF (LOCKED)'}</span>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col items-center justify-center gap-2">
                  <span className="text-xs text-slate-500 uppercase tracking-tighter">Buzzer / LED</span>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${buzzerActive ? 'bg-red-500 text-white shadow-lg shadow-red-200 animate-ping' : 'bg-slate-200 text-slate-400'}`}>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
                  </div>
                  <span className={`text-[10px] font-bold ${buzzerActive ? 'text-red-600' : 'text-slate-400'}`}>{buzzerActive ? 'BEEPING' : 'SILENT'}</span>
                </div>
              </div>

              {/* Management Shortcuts */}
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    setUsers([{ id: 1, password: '111111' }, { id: 2, password: '222222' }]);
                    addLog('Pre-loaded test users', currentState);
                  }}
                  className="flex-1 py-2 text-xs bg-slate-100 hover:bg-slate-200 rounded-lg font-medium transition-colors"
                >
                  写入预置密码
                </button>
                <button 
                  onClick={() => {
                    setCurrentState(State.STATE4_STANDBY);
                    setErrorCount(0);
                    setUsers([]);
                    setLockTimer(0);
                    setLogs([]);
                    addLog('Simulator Reset', State.STATE4_STANDBY);
                  }}
                  className="flex-1 py-2 text-xs bg-red-50 text-red-600 hover:bg-red-100 rounded-lg font-medium transition-colors"
                >
                  重置仿真器
                </button>
              </div>
            </div>
          </div>

          <div className="bg-slate-800 p-6 rounded-2xl shadow-lg flex-1 overflow-hidden flex flex-col">
            <h2 className="text-sm font-bold text-slate-400 mb-3 uppercase tracking-widest flex items-center justify-between">
              事件日志 (Serial Log)
              <span className="text-[10px] font-normal lowercase bg-slate-700 px-2 py-0.5 rounded">auto-scroll</span>
            </h2>
            <div className="flex-1 overflow-y-auto space-y-2 font-mono text-xs pr-2 custom-scrollbar">
              {logs.map((log, idx) => (
                <div key={idx} className="border-l-2 border-slate-700 pl-3 py-1">
                  <div className="flex justify-between text-slate-500 mb-1">
                    <span>{log.timestamp}</span>
                    <span className="text-blue-400">{log.state}</span>
                  </div>
                  <div className="text-slate-200 break-words">{log.event}</div>
                  {log.errorCount > 0 && <div className="text-red-400 text-[10px]">Errors: {log.errorCount}</div>}
                </div>
              ))}
              {logs.length === 0 && <div className="text-slate-600 italic">Waiting for events...</div>}
            </div>
          </div>
        </div>
      </div>

      <footer className="text-slate-400 text-xs mt-auto py-8">
        &copy; 2024 布文出品 | Based on 51 Project logic
      </footer>
    </div>
  );
};

export default App;
