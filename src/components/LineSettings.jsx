import React, { useState, useEffect } from 'react';
import { 
  Save, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  Globe, 
  Key,
  HelpCircle,
  Copy
} from 'lucide-react';
import { API_URL } from '../config';

const LineSettings = ({ shop, onBack }) => {
  const [config, setConfig] = useState({
    channelAccessToken: '',
    channelSecret: '',
    ngrokUrl: ''
  });
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [webhookUrl, setWebhookUrl] = useState('');
  const [isConfigLoaded, setIsConfigLoaded] = useState(false);

  // Load saved config from localStorage and send to backend
  useEffect(() => {
    const loadAndSendConfig = async () => {
      const saved = localStorage.getItem('line_config');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setConfig(parsed);
          if (parsed.ngrokUrl) {
            setWebhookUrl(`${parsed.ngrokUrl}/webhook/line`);
          }
          
          setIsConfigLoaded(true);
          
          // Auto-send to backend
          if (parsed.channelAccessToken && parsed.channelSecret && parsed.ngrokUrl) {
            const response = await fetch(`${API_URL}/api/config/update`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                channelAccessToken: parsed.channelAccessToken,
                channelSecret: parsed.channelSecret,
                ngrokUrl: parsed.ngrokUrl
              })
            });
            
            if (response.ok) {
              setStatus({ 
                type: 'success', 
                message: '✅ โหลดการตั้งค่าจาก localStorage สำเร็จ - พร้อมใช้งาน!' 
              });
              console.log('✅ Config auto-loaded and sent to backend');
            } else {
              setStatus({ 
                type: 'warning', 
                message: '⚠️ โหลดข้อมูลสำเร็จ แต่ไม่สามารถส่งไปยัง backend ได้' 
              });
            }
          }
        } catch (error) {
          console.error('Failed to load config:', error);
        }
      }
    };
    
    loadAndSendConfig();
  }, []);

  // Update webhook URL when ngrok URL changes
  useEffect(() => {
    if (config.ngrokUrl) {
      const cleanUrl = config.ngrokUrl.replace(/\/$/, ''); // Remove trailing slash
      setWebhookUrl(`${cleanUrl}/webhook/line`);
    }
  }, [config.ngrokUrl]);

  const handleSave = async () => {
    // Validate inputs
    if (!config.channelAccessToken || !config.channelSecret) {
      setStatus({ 
        type: 'error', 
        message: '❌ กรุณากรอก Channel Access Token และ Channel Secret' 
      });
      return;
    }

    if (!config.ngrokUrl) {
      setStatus({ 
        type: 'error', 
        message: '❌ กรุณากรอก ngrok URL' 
      });
      return;
    }

    setSaving(true);
    setStatus({ type: '', message: '' });

    try {
      // Save to localStorage
      localStorage.setItem('line_config', JSON.stringify(config));

      // Send to backend (localhost:3000)
          const response = await fetch(`${API_URL}/api/config/update`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              channelAccessToken: config.channelAccessToken,
              channelSecret: config.channelSecret,
              ngrokUrl: config.ngrokUrl
            })
          });

      const data = await response.json();
      
      if (data.success) {
        setStatus({ 
          type: 'success', 
          message: '✅ บันทึกการตั้งค่าสำเร็จ! พร้อมใช้งาน 🎉' 
        });
      } else {
        throw new Error(data.error || 'Failed to save to backend');
      }
    } catch (error) {
      console.error('Save error:', error);
      setStatus({ 
        type: 'warning', 
        message: `⚠️ บันทึกใน localStorage สำเร็จ แต่ไม่สามารถเชื่อมต่อ backend ได้\nกรุณาตรวจสอบว่า server กำลังทำงานและ ngrok URL ถูกต้อง` 
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!config.ngrokUrl) {
      setStatus({ 
        type: 'error', 
        message: '❌ กรุณากรอก ngrok URL และกด Save ก่อน' 
      });
      return;
    }

    setTesting(true);
    setStatus({ type: '', message: '' });

    try {
      const response = await fetch(`${API_URL}/webhook/line`, {
        method: 'HEAD'
      });

      if (response.status === 200 || response.status === 405 || response.status === 400) {
        setStatus({ 
          type: 'success', 
          message: '✅ เชื่อมต่อ webhook server สำเร็จ!' 
        });
      } else {
        throw new Error('Server not responding correctly');
      }
    } catch (error) {
      console.error('Test error:', error);
      setStatus({ 
        type: 'error', 
        message: '❌ ไม่สามารถเชื่อมต่อ webhook server ได้\nกรุณาตรวจสอบว่า:\n1. Backend server กำลังทำงาน (npm start)\n2. ngrok กำลังทำงาน (ngrok http 3000)\n3. ngrok URL ถูกต้อง' 
      });
    } finally {
      setTesting(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setStatus({ type: 'success', message: '📋 คัดลอกแล้ว!' });
    setTimeout(() => setStatus({ type: '', message: '' }), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-semibold text-[#1D1D1F] mb-2">
          ⚙️ การตั้งค่า LINE Official Account
        </h2>
        <p className="text-gray-500">
          กำหนดค่า LINE Messaging API และ Webhook URL สำหรับเชื่อมต่อกับระบบ
        </p>
      </div>

      {/* Status Message */}
      {status.message && (
        <div className={`mb-6 p-4 rounded-xl border flex items-start gap-3 ${
          status.type === 'success' 
            ? 'bg-green-50 border-green-200' 
            : status.type === 'warning'
            ? 'bg-yellow-50 border-yellow-200'
            : 'bg-red-50 border-red-200'
        }`}>
          {status.type === 'success' ? (
            <CheckCircle2 className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
          ) : (
            <AlertCircle className={`${status.type === 'warning' ? 'text-yellow-600' : 'text-red-600'} flex-shrink-0 mt-0.5`} size={20} />
          )}
          <p className={`text-sm whitespace-pre-line ${
            status.type === 'success' 
              ? 'text-green-800' 
              : status.type === 'warning'
              ? 'text-yellow-800'
              : 'text-red-800'
          }`}>
            {status.message}
          </p>
        </div>
      )}

      {/* Step 1: ngrok URL */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-semibold text-[#1D1D1F] flex items-center gap-2">
              <Globe size={18} className="text-[#007AFF]" />
              ขั้นตอนที่ 1: ngrok Webhook URL
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              เริ่ม backend server และ ngrok จากนั้นใส่ ngrok URL ที่นี่
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-[#1D1D1F] p-4 rounded-xl text-white text-sm font-mono space-y-2">
            <div className="text-gray-400"># Terminal 1: เริ่ม backend server</div>
            <div>cd line-webhook</div>
            <div>npm install</div>
            <div>npm start</div>
            <div className="text-gray-400 mt-4"># Terminal 2: เริ่ม ngrok</div>
            <div>ngrok http 3000</div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ngrok URL (เช่น https://xxxx.ngrok.io)
            </label>
            <input
              type="text"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#007AFF]/20 focus:border-[#007AFF] transition font-mono text-sm"
              placeholder="https://xxxx-xxx-xxx-xxx.ngrok-free.app"
              value={config.ngrokUrl}
              onChange={(e) => setConfig({ ...config, ngrokUrl: e.target.value })}
            />
            <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
              <HelpCircle size={12} />
              คัดลอกจาก ngrok terminal (Forwarding URL) - ห้ามใส่ /webhook/line ต่อท้าย
            </p>
          </div>

          {webhookUrl && (
            <div className="bg-[#007AFF]/5 border border-[#007AFF]/20 p-4 rounded-xl">
              <p className="text-xs font-medium text-gray-700 mb-2">
                📍 Webhook URL ที่จะใช้กับ LINE Developers Console:
              </p>
              <div className="flex gap-2">
                <div className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono text-gray-700 break-all">
                  {webhookUrl}
                </div>
                <button
                  onClick={() => copyToClipboard(webhookUrl)}
                  className="px-3 bg-[#007AFF] text-white rounded-lg hover:bg-[#0062CC] transition flex items-center gap-2"
                  title="Copy"
                >
                  <Copy size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Step 2: LINE Credentials */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-semibold text-[#1D1D1F] flex items-center gap-2">
              <Key size={18} className="text-[#06C755]" />
              ขั้นตอนที่ 2: LINE Developers Console
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              ใส่ข้อมูลจาก{' '}
              <a 
                href="https://developers.line.biz/console/" 
                target="_blank" 
                className="text-[#06C755] underline inline-flex items-center gap-1"
              >
                LINE Developers Console
                <ExternalLink size={10} />
              </a>
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Channel Secret
            </label>
            <input
              type="password"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#06C755]/20 focus:border-[#06C755] transition font-mono text-sm"
              placeholder="e5a2..."
              value={config.channelSecret}
              onChange={(e) => setConfig({ ...config, channelSecret: e.target.value })}
            />
            <p className="text-xs text-gray-500 mt-1.5">
              หาได้จาก: Basic settings &gt; Channel secret
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Channel Access Token (Long-lived)
            </label>
            <textarea
              rows={4}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#06C755]/20 focus:border-[#06C755] transition font-mono text-sm resize-none"
              placeholder="eyJhbGciOiJIUzI1NiJ9..."
              value={config.channelAccessToken}
              onChange={(e) => setConfig({ ...config, channelAccessToken: e.target.value })}
            />
            <p className="text-xs text-gray-500 mt-1.5">
              หาได้จาก: Messaging API &gt; Channel access token &gt; กด Issue
            </p>
          </div>
        </div>
      </div>

      {/* Step 3: Configure LINE Webhook */}
      <div className="bg-[#06C755]/5 border border-[#06C755]/20 rounded-2xl p-6 mb-6">
        <h3 className="font-semibold text-[#1D1D1F] mb-3">
          📝 ขั้นตอนที่ 3: ตั้งค่า Webhook ใน LINE Developers Console
        </h3>
        <ol className="space-y-2 text-sm text-gray-700">
          <li className="flex gap-2">
            <span className="font-bold">1.</span>
            <span>เปิด LINE Developers Console &gt; เลือก Provider และ Channel ของคุณ</span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold">2.</span>
            <span>ไปที่ Messaging API tab</span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold">3.</span>
            <span>หาส่วน "Webhook settings" และกด Edit</span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold">4.</span>
            <span>ใส่ Webhook URL ด้านบน ({webhookUrl || 'กรุณากรอก ngrok URL ก่อน'})</span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold">5.</span>
            <span>เปิด "Use webhook" เป็น Enabled</span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold">6.</span>
            <span>กด "Verify" เพื่อทดสอบการเชื่อมต่อ (ต้อง Save ข้างล่างก่อน)</span>
          </li>
        </ol>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 bg-[#06C755] text-white px-6 py-3.5 rounded-xl font-medium hover:bg-[#05b54d] transition flex items-center justify-center gap-2 shadow-md shadow-green-200 disabled:opacity-50"
        >
          {saving ? (
            <>
              <RefreshCw size={18} className="animate-spin" />
              กำลังบันทึก...
            </>
          ) : (
            <>
              <Save size={18} />
              บันทึกการตั้งค่า
            </>
          )}
        </button>

        <button
          onClick={handleTest}
          disabled={testing}
          className="px-6 py-3.5 border-2 border-[#007AFF] text-[#007AFF] rounded-xl font-medium hover:bg-[#007AFF] hover:text-white transition flex items-center gap-2 disabled:opacity-50"
        >
          {testing ? (
            <>
              <RefreshCw size={18} className="animate-spin" />
              กำลังทดสอบ...
            </>
          ) : (
            <>
              <RefreshCw size={18} />
              ทดสอบการเชื่อมต่อ
            </>
          )}
        </button>
      </div>

      {/* Helper Notes */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-xl">
        <p className="text-sm text-blue-800">
          <strong>💡 คำแนะนำ:</strong>
        </p>
        <ul className="text-xs text-blue-700 mt-2 space-y-1 ml-4">
          <li>• หลังจาก Save แล้ว ข้อมูลจะถูกเก็บไว้ใน localStorage และส่งไปยัง backend</li>
          <li>• ทดสอบด้วยการส่งข้อความผ่าน LINE Official Account แล้วดูใน backend terminal</li>
          <li>• ngrok URL จะเปลี่ยนทุกครั้งที่เริ่ม ngrok ใหม่ ต้องอัพเดท URL ที่ LINE Console ด้วย</li>
        </ul>
      </div>
    </div>
  );
};

export default LineSettings;

