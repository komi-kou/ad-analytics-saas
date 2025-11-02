import React, { useState, useEffect } from 'react';

const AdAnalyticsConfigUI = () => {
  // State management
  const [user, setUser] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const API_URL = 'https://your-backend-url.railway.app';

  // Load accounts on mount
  useEffect(() => {
    if (user) {
      loadAccounts();
    }
  }, [user]);

  // Login function
  const handleLogin = async (email, gomarbleToken) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/gomarble`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, gomarbleToken })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
        showMessage('success', 'ログインしました');
      }
    } catch (error) {
      showMessage('error', 'ログインに失敗しました');
    }
  };

  // Load accounts
  const loadAccounts = async () => {
    try {
      const response = await fetch(`${API_URL}/api/accounts`, {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setAccounts(data.accounts);
      }
    } catch (error) {
      showMessage('error', 'アカウント取得に失敗しました');
    }
  };

  // Load account configuration
  const loadConfig = async (accountId) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/accounts/${accountId}/config`, {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setConfig(data.config);
        setSelectedAccount(accountId);
      }
    } catch (error) {
      showMessage('error', '設定の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // Save configuration
  const saveConfig = async () => {
    if (!selectedAccount || !config) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/accounts/${selectedAccount}/config`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          chatwork: {
            roomId: config.room_id,
            apiToken: config.api_token,
            enabled: config.chatwork_enabled,
            schedule: config.schedule,
            dayOfWeek: config.day_of_week,
            time: config.time,
            timezone: config.timezone
          },
          metrics: {
            include_spend: config.include_spend,
            include_impressions: config.include_impressions,
            include_clicks: config.include_clicks,
            include_ctr: config.include_ctr,
            include_cpc: config.include_cpc,
            include_cpm: config.include_cpm,
            include_conversions: config.include_conversions,
            include_cpa: config.include_cpa,
            include_conversion_values: config.include_conversion_values,
            include_roas: config.include_roas,
            include_reach: config.include_reach,
            include_frequency: config.include_frequency,
            include_video_plays: config.include_video_plays,
            include_video_p25: config.include_video_p25,
            include_video_p50: config.include_video_p50,
            include_video_p75: config.include_video_p75,
            include_video_p100: config.include_video_p100,
            include_purchases: config.include_purchases,
            include_leads: config.include_leads,
            include_app_installs: config.include_app_installs,
            include_page_views: config.include_page_views
          },
          analysisLevels: {
            include_account_summary: config.include_account_summary,
            include_campaign_analysis: config.include_campaign_analysis,
            campaign_top_count: config.campaign_top_count,
            campaign_worst_count: config.campaign_worst_count,
            include_creative_analysis: config.include_creative_analysis,
            creative_per_campaign_count: config.creative_per_campaign_count,
            include_format_comparison: config.include_format_comparison,
            include_trend_analysis: config.include_trend_analysis,
            trend_weeks_back: config.trend_weeks_back
          }
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        showMessage('success', '設定を保存しました');
      }
    } catch (error) {
      showMessage('error', '設定の保存に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // Test Chatwork connection
  const testChatwork = async () => {
    if (!selectedAccount) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/accounts/${selectedAccount}/test`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        showMessage('success', 'テストメッセージを送信しました');
      }
    } catch (error) {
      showMessage('error', 'テスト送信に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // Show message
  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  // Update config field
  const updateConfig = (field, value) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  // Login screen
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">
            広告分析システム
          </h1>
          <LoginForm onLogin={handleLogin} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">
            広告分析システム
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user.email}</span>
            <button
              onClick={() => {
                setUser(null);
                localStorage.removeItem('user');
              }}
              className="text-sm text-red-600 hover:text-red-700"
            >
              ログアウト
            </button>
          </div>
        </div>
      </header>

      {/* Message Banner */}
      {message.text && (
        <div className={`max-w-7xl mx-auto px-4 py-3 mt-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Account List Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">アカウント一覧</h2>
              <div className="space-y-2">
                {accounts.map(account => (
                  <button
                    key={account.id}
                    onClick={() => loadConfig(account.id)}
                    className={`w-full text-left p-3 rounded-lg transition ${
                      selectedAccount === account.id
                        ? 'bg-indigo-100 border-2 border-indigo-500'
                        : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                    }`}
                  >
                    <div className="font-medium">{account.account_name}</div>
                    <div className="text-sm text-gray-500 capitalize">{account.platform}</div>
                    <div className="text-xs text-gray-400 mt-1">
                      {account.chatwork_enabled ? '✅ 送信有効' : '⚠️ 送信無効'}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Configuration Panel */}
          <div className="lg:col-span-3">
            {!selectedAccount ? (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                <p className="text-gray-500 text-lg">
                  左側からアカウントを選択してください
                </p>
              </div>
            ) : loading ? (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="text-gray-500 mt-4">読み込み中...</p>
              </div>
            ) : config ? (
              <div className="space-y-6">
                {/* Account Header */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {config.account_name} の設定
                  </h2>
                  <p className="text-sm text-gray-500 mt-1 capitalize">
                    {config.platform} • {config.account_id}
                  </p>
                </div>

                {/* Chatwork Settings */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    💬 Chatwork設定
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="chatwork-enabled"
                        checked={config.chatwork_enabled}
                        onChange={(e) => updateConfig('chatwork_enabled', e.target.checked)}
                        className="w-5 h-5 text-indigo-600 rounded"
                      />
                      <label htmlFor="chatwork-enabled" className="font-medium">
                        Chatwork通知を有効にする
                      </label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          ルームID
                        </label>
                        <input
                          type="text"
                          value={config.room_id || ''}
                          onChange={(e) => updateConfig('room_id', e.target.value)}
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                          placeholder="12345678"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          APIトークン
                        </label>
                        <input
                          type="password"
                          value={config.api_token || ''}
                          onChange={(e) => updateConfig('api_token', e.target.value)}
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                          placeholder="Your Chatwork API Token"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          実行頻度
                        </label>
                        <select
                          value={config.schedule || 'weekly'}
                          onChange={(e) => updateConfig('schedule', e.target.value)}
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="daily">毎日</option>
                          <option value="weekly">毎週</option>
                          <option value="monthly">毎月</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          曜日
                        </label>
                        <select
                          value={config.day_of_week || 1}
                          onChange={(e) => updateConfig('day_of_week', parseInt(e.target.value))}
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="0">日曜日</option>
                          <option value="1">月曜日</option>
                          <option value="2">火曜日</option>
                          <option value="3">水曜日</option>
                          <option value="4">木曜日</option>
                          <option value="5">金曜日</option>
                          <option value="6">土曜日</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          実行時刻
                        </label>
                        <input
                          type="time"
                          value={config.time || '09:00'}
                          onChange={(e) => updateConfig('time', e.target.value)}
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>

                    <button
                      onClick={testChatwork}
                      disabled={loading || !config.chatwork_enabled}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      テスト送信
                    </button>
                  </div>
                </div>

                {/* Metrics Configuration */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    📊 取得する指標
                  </h3>
                  
                  <div className="space-y-6">
                    {/* Basic Metrics */}
                    <div>
                      <h4 className="font-medium text-gray-700 mb-3">基本指標</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        <MetricCheckbox
                          label="💰 広告費"
                          checked={config.include_spend}
                          onChange={(v) => updateConfig('include_spend', v)}
                        />
                        <MetricCheckbox
                          label="👁️ インプレッション"
                          checked={config.include_impressions}
                          onChange={(v) => updateConfig('include_impressions', v)}
                        />
                        <MetricCheckbox
                          label="🖱️ クリック数"
                          checked={config.include_clicks}
                          onChange={(v) => updateConfig('include_clicks', v)}
                        />
                        <MetricCheckbox
                          label="📈 CTR"
                          checked={config.include_ctr}
                          onChange={(v) => updateConfig('include_ctr', v)}
                        />
                        <MetricCheckbox
                          label="💵 CPC"
                          checked={config.include_cpc}
                          onChange={(v) => updateConfig('include_cpc', v)}
                        />
                        <MetricCheckbox
                          label="🎯 CPM"
                          checked={config.include_cpm}
                          onChange={(v) => updateConfig('include_cpm', v)}
                        />
                      </div>
                    </div>

                    {/* Conversion Metrics */}
                    <div>
                      <h4 className="font-medium text-gray-700 mb-3">コンバージョン指標</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        <MetricCheckbox
                          label="🛒 CV数"
                          checked={config.include_conversions}
                          onChange={(v) => updateConfig('include_conversions', v)}
                        />
                        <MetricCheckbox
                          label="💰 CPA"
                          checked={config.include_cpa}
                          onChange={(v) => updateConfig('include_cpa', v)}
                        />
                        <MetricCheckbox
                          label="💵 CV金額"
                          checked={config.include_conversion_values}
                          onChange={(v) => updateConfig('include_conversion_values', v)}
                        />
                        <MetricCheckbox
                          label="📊 ROAS"
                          checked={config.include_roas}
                          onChange={(v) => updateConfig('include_roas', v)}
                        />
                      </div>
                    </div>

                    {/* Engagement Metrics */}
                    <div>
                      <h4 className="font-medium text-gray-700 mb-3">エンゲージメント指標</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        <MetricCheckbox
                          label="👥 リーチ"
                          checked={config.include_reach}
                          onChange={(v) => updateConfig('include_reach', v)}
                        />
                        <MetricCheckbox
                          label="🔄 フリークエンシー"
                          checked={config.include_frequency}
                          onChange={(v) => updateConfig('include_frequency', v)}
                        />
                      </div>
                    </div>

                    {/* Video Metrics */}
                    <div>
                      <h4 className="font-medium text-gray-700 mb-3">動画指標（動画クリエイティブのみ）</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        <MetricCheckbox
                          label="▶️ 再生数"
                          checked={config.include_video_plays}
                          onChange={(v) => updateConfig('include_video_plays', v)}
                        />
                        <MetricCheckbox
                          label="25% 視聴"
                          checked={config.include_video_p25}
                          onChange={(v) => updateConfig('include_video_p25', v)}
                        />
                        <MetricCheckbox
                          label="50% 視聴"
                          checked={config.include_video_p50}
                          onChange={(v) => updateConfig('include_video_p50', v)}
                        />
                        <MetricCheckbox
                          label="75% 視聴"
                          checked={config.include_video_p75}
                          onChange={(v) => updateConfig('include_video_p75', v)}
                        />
                        <MetricCheckbox
                          label="100% 視聴"
                          checked={config.include_video_p100}
                          onChange={(v) => updateConfig('include_video_p100', v)}
                        />
                      </div>
                    </div>

                    {/* Action Metrics */}
                    <div>
                      <h4 className="font-medium text-gray-700 mb-3">アクション別指標</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        <MetricCheckbox
                          label="🛒 購入"
                          checked={config.include_purchases}
                          onChange={(v) => updateConfig('include_purchases', v)}
                        />
                        <MetricCheckbox
                          label="📝 リード"
                          checked={config.include_leads}
                          onChange={(v) => updateConfig('include_leads', v)}
                        />
                        <MetricCheckbox
                          label="📱 アプリDL"
                          checked={config.include_app_installs}
                          onChange={(v) => updateConfig('include_app_installs', v)}
                        />
                        <MetricCheckbox
                          label="📄 ページ閲覧"
                          checked={config.include_page_views}
                          onChange={(v) => updateConfig('include_page_views', v)}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Analysis Levels Configuration */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    📈 分析レベル
                  </h3>
                  
                  <div className="space-y-6">
                    {/* Level 1: Account Summary */}
                    <div className="border-l-4 border-indigo-500 pl-4">
                      <div className="flex items-center gap-3 mb-2">
                        <input
                          type="checkbox"
                          id="level-account-summary"
                          checked={config.include_account_summary}
                          onChange={(e) => updateConfig('include_account_summary', e.target.checked)}
                          className="w-5 h-5 text-indigo-600 rounded"
                        />
                        <label htmlFor="level-account-summary" className="font-medium">
                          レベル1: アカウント全体サマリー
                        </label>
                      </div>
                      <p className="text-sm text-gray-600 ml-8">
                        総広告費、総CV数、平均CPA、ROASなどの全体指標
                      </p>
                    </div>

                    {/* Level 2: Campaign Analysis */}
                    <div className="border-l-4 border-green-500 pl-4">
                      <div className="flex items-center gap-3 mb-2">
                        <input
                          type="checkbox"
                          id="level-campaign"
                          checked={config.include_campaign_analysis}
                          onChange={(e) => updateConfig('include_campaign_analysis', e.target.checked)}
                          className="w-5 h-5 text-green-600 rounded"
                        />
                        <label htmlFor="level-campaign" className="font-medium">
                          レベル2: キャンペーン別分析
                        </label>
                      </div>
                      <p className="text-sm text-gray-600 ml-8 mb-3">
                        トップ/ワーストキャンペーンの詳細分析
                      </p>
                      {config.include_campaign_analysis && (
                        <div className="ml-8 grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm text-gray-700 mb-1">
                              トップ表示数
                            </label>
                            <input
                              type="number"
                              value={config.campaign_top_count || 3}
                              onChange={(e) => updateConfig('campaign_top_count', parseInt(e.target.value))}
                              className="w-full px-3 py-2 border rounded-lg"
                              min="1"
                              max="10"
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-700 mb-1">
                              ワースト表示数
                            </label>
                            <input
                              type="number"
                              value={config.campaign_worst_count || 3}
                              onChange={(e) => updateConfig('campaign_worst_count', parseInt(e.target.value))}
                              className="w-full px-3 py-2 border rounded-lg"
                              min="1"
                              max="10"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Level 3: Creative Analysis */}
                    <div className="border-l-4 border-yellow-500 pl-4">
                      <div className="flex items-center gap-3 mb-2">
                        <input
                          type="checkbox"
                          id="level-creative"
                          checked={config.include_creative_analysis}
                          onChange={(e) => updateConfig('include_creative_analysis', e.target.checked)}
                          className="w-5 h-5 text-yellow-600 rounded"
                        />
                        <label htmlFor="level-creative" className="font-medium">
                          レベル3: クリエイティブ別詳細分析
                        </label>
                      </div>
                      <p className="text-sm text-gray-600 ml-8 mb-3">
                        各キャンペーンのクリエイティブパフォーマンス分析
                      </p>
                      {config.include_creative_analysis && (
                        <div className="ml-8">
                          <label className="block text-sm text-gray-700 mb-1">
                            キャンペーンごとのクリエイティブ表示数
                          </label>
                          <input
                            type="number"
                            value={config.creative_per_campaign_count || 5}
                            onChange={(e) => updateConfig('creative_per_campaign_count', parseInt(e.target.value))}
                            className="w-full max-w-xs px-3 py-2 border rounded-lg"
                            min="1"
                            max="20"
                          />
                        </div>
                      )}
                    </div>

                    {/* Level 4: Format Comparison */}
                    <div className="border-l-4 border-purple-500 pl-4">
                      <div className="flex items-center gap-3 mb-2">
                        <input
                          type="checkbox"
                          id="level-format"
                          checked={config.include_format_comparison}
                          onChange={(e) => updateConfig('include_format_comparison', e.target.checked)}
                          className="w-5 h-5 text-purple-600 rounded"
                        />
                        <label htmlFor="level-format" className="font-medium">
                          レベル4: フォーマット別比較
                        </label>
                      </div>
                      <p className="text-sm text-gray-600 ml-8">
                        画像 vs 動画 vs カルーセルのパフォーマンス比較
                      </p>
                    </div>

                    {/* Level 5: Trend Analysis */}
                    <div className="border-l-4 border-red-500 pl-4">
                      <div className="flex items-center gap-3 mb-2">
                        <input
                          type="checkbox"
                          id="level-trend"
                          checked={config.include_trend_analysis}
                          onChange={(e) => updateConfig('include_trend_analysis', e.target.checked)}
                          className="w-5 h-5 text-red-600 rounded"
                        />
                        <label htmlFor="level-trend" className="font-medium">
                          レベル5: 時系列トレンド分析
                        </label>
                      </div>
                      <p className="text-sm text-gray-600 ml-8 mb-3">
                        週次/月次のトレンド変化と異常検知
                      </p>
                      {config.include_trend_analysis && (
                        <div className="ml-8">
                          <label className="block text-sm text-gray-700 mb-1">
                            遡る週数
                          </label>
                          <input
                            type="number"
                            value={config.trend_weeks_back || 4}
                            onChange={(e) => updateConfig('trend_weeks_back', parseInt(e.target.value))}
                            className="w-full max-w-xs px-3 py-2 border rounded-lg"
                            min="2"
                            max="12"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            過去 {config.trend_weeks_back || 4} 週間のトレンドを分析
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Save Button */}
                <div className="flex gap-4">
                  <button
                    onClick={saveConfig}
                    disabled={loading}
                    className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
                  >
                    {loading ? '保存中...' : '設定を保存'}
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

// Metric Checkbox Component
const MetricCheckbox = ({ label, checked, onChange }) => (
  <label className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-gray-50">
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="w-4 h-4 text-indigo-600 rounded"
    />
    <span className="text-sm">{label}</span>
  </label>
);

// Login Form Component
const LoginForm = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(email, token);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          メールアドレス
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
          placeholder="your@email.com"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          gomarble トークン
        </label>
        <input
          type="password"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
          placeholder="Your gomarble token"
          required
        />
      </div>
      <button
        type="submit"
        className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition"
      >
        ログイン
      </button>
      <p className="text-xs text-gray-500 text-center mt-4">
        gomarble.aiで事前にアカウント連携が必要です
      </p>
    </form>
  );
};

export default AdAnalyticsConfigUI;
