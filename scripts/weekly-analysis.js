// ============================================
// Weekly Ad Analysis Script - All 5 Levels
// ============================================

const { Pool } = require('pg');
const crypto = require('crypto');
require('dotenv').config();

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// ============================================
// Helper Functions
// ============================================

function decrypt(text) {
  const algorithm = 'aes-256-cbc';
  const key = crypto.scryptSync(process.env.ENCRYPTION_KEY || 'default-key', 'salt', 32);
  const parts = text.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encryptedText = parts[1];
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

function generateId(prefix) {
  return `${prefix}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
}

// ============================================
// Data Fetching from gomarble-mcp-server
// ============================================

async function fetchFacebookData(actId, dateRange, level, fields) {
  // This function will be called by the analysis script
  // In production, this would interact with gomarble-mcp-server
  
  const url = 'https://api.gomarble.ai/mcp/facebook/insights';
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.GOMARBLE_TOKEN}`
    },
    body: JSON.stringify({
      act_id: actId,
      date_preset: dateRange,
      level: level,
      fields: fields,
      filtering: [{ field: 'impressions', operator: 'GREATER_THAN', value: 0 }],
      limit: 200
    })
  });
  
  return await response.json();
}

// ============================================
// Analysis Functions - 5 Levels
// ============================================

// Level 1: Account Summary
function analyzeAccountSummary(data) {
  const summary = {
    total_spend: 0,
    total_impressions: 0,
    total_clicks: 0,
    total_conversions: 0,
    total_conversion_value: 0,
    total_reach: 0
  };
  
  data.forEach(item => {
    summary.total_spend += parseFloat(item.spend || 0);
    summary.total_impressions += parseInt(item.impressions || 0);
    summary.total_clicks += parseInt(item.clicks || 0);
    summary.total_conversions += parseFloat(item.conversions || 0);
    summary.total_conversion_value += parseFloat(item.conversion_values || 0);
    summary.total_reach += parseInt(item.reach || 0);
  });
  
  // Calculate derived metrics
  summary.average_ctr = summary.total_impressions > 0 
    ? (summary.total_clicks / summary.total_impressions * 100).toFixed(2) 
    : 0;
  summary.average_cpc = summary.total_clicks > 0 
    ? (summary.total_spend / summary.total_clicks).toFixed(2) 
    : 0;
  summary.average_cpm = summary.total_impressions > 0 
    ? (summary.total_spend / summary.total_impressions * 1000).toFixed(2) 
    : 0;
  summary.average_cpa = summary.total_conversions > 0 
    ? (summary.total_spend / summary.total_conversions).toFixed(2) 
    : 0;
  summary.roas = summary.total_spend > 0 
    ? (summary.total_conversion_value / summary.total_spend).toFixed(2) 
    : 0;
  summary.frequency = summary.total_reach > 0 
    ? (summary.total_impressions / summary.total_reach).toFixed(2) 
    : 0;
  
  return summary;
}

// Level 2: Campaign Analysis (Top & Worst)
function analyzeCampaigns(data, topCount, worstCount) {
  // Calculate CPA for each campaign
  const campaignsWithMetrics = data.map(campaign => {
    const spend = parseFloat(campaign.spend || 0);
    const conversions = parseFloat(campaign.conversions || 0);
    const cpa = conversions > 0 ? spend / conversions : 999999;
    
    return {
      ...campaign,
      calculated_cpa: cpa,
      ctr: parseFloat(campaign.ctr || 0),
      cpc: parseFloat(campaign.cpc || 0),
      cpm: parseFloat(campaign.cpm || 0)
    };
  });
  
  // Sort by CPA (best to worst)
  const sortedByCPA = [...campaignsWithMetrics].sort((a, b) => a.calculated_cpa - b.calculated_cpa);
  
  // Get top performers (lowest CPA)
  const topPerformers = sortedByCPA.slice(0, topCount).map(c => ({
    name: c.campaign_name || c.name,
    spend: parseFloat(c.spend || 0),
    conversions: parseFloat(c.conversions || 0),
    cpa: c.calculated_cpa !== 999999 ? c.calculated_cpa : null,
    ctr: c.ctr,
    cpc: c.cpc,
    cpm: c.cpm,
    impressions: parseInt(c.impressions || 0),
    clicks: parseInt(c.clicks || 0),
    status: 'top_performer'
  }));
  
  // Get worst performers (highest CPA, but with conversions)
  const worstPerformers = sortedByCPA
    .filter(c => c.calculated_cpa !== 999999)
    .slice(-worstCount)
    .reverse()
    .map(c => ({
      name: c.campaign_name || c.name,
      spend: parseFloat(c.spend || 0),
      conversions: parseFloat(c.conversions || 0),
      cpa: c.calculated_cpa,
      ctr: c.ctr,
      cpc: c.cpc,
      cpm: c.cpm,
      impressions: parseInt(c.impressions || 0),
      clicks: parseInt(c.clicks || 0),
      status: 'needs_improvement'
    }));
  
  return {
    top_performers: topPerformers,
    worst_performers: worstPerformers,
    total_campaigns: data.length
  };
}

// Level 3: Creative Analysis
function analyzeCreatives(data, perCampaignCount) {
  // Group creatives by campaign
  const campaignCreatives = {};
  
  data.forEach(creative => {
    const campaignId = creative.campaign_id;
    const campaignName = creative.campaign_name || 'Unknown Campaign';
    
    if (!campaignCreatives[campaignId]) {
      campaignCreatives[campaignId] = {
        campaign_name: campaignName,
        creatives: []
      };
    }
    
    const spend = parseFloat(creative.spend || 0);
    const conversions = parseFloat(creative.conversions || 0);
    const cpa = conversions > 0 ? spend / conversions : 999999;
    
    campaignCreatives[campaignId].creatives.push({
      name: creative.ad_name || creative.name,
      spend: spend,
      conversions: conversions,
      cpa: cpa !== 999999 ? cpa : null,
      ctr: parseFloat(creative.ctr || 0),
      cpc: parseFloat(creative.cpc || 0),
      cpm: parseFloat(creative.cpm || 0),
      impressions: parseInt(creative.impressions || 0),
      clicks: parseInt(creative.clicks || 0)
    });
  });
  
  // Sort creatives within each campaign by CPA
  Object.keys(campaignCreatives).forEach(campaignId => {
    campaignCreatives[campaignId].creatives.sort((a, b) => {
      if (a.cpa === null) return 1;
      if (b.cpa === null) return -1;
      return a.cpa - b.cpa;
    });
    
    // Keep only top N creatives per campaign
    campaignCreatives[campaignId].creatives = campaignCreatives[campaignId].creatives.slice(0, perCampaignCount);
  });
  
  return campaignCreatives;
}

// Level 4: Format Comparison
function analyzeFormats(data) {
  // In production, you would detect format from creative type
  // For now, we'll simulate format detection
  
  const formats = {
    image: { count: 0, spend: 0, conversions: 0, impressions: 0, clicks: 0 },
    video: { count: 0, spend: 0, conversions: 0, impressions: 0, clicks: 0 },
    carousel: { count: 0, spend: 0, conversions: 0, impressions: 0, clicks: 0 }
  };
  
  data.forEach(creative => {
    // Detect format (simplified - in production use actual creative type)
    let format = 'image';
    if (creative.ad_name && creative.ad_name.includes('動画')) format = 'video';
    if (creative.ad_name && creative.ad_name.includes('カルーセル')) format = 'carousel';
    
    formats[format].count++;
    formats[format].spend += parseFloat(creative.spend || 0);
    formats[format].conversions += parseFloat(creative.conversions || 0);
    formats[format].impressions += parseInt(creative.impressions || 0);
    formats[format].clicks += parseInt(creative.clicks || 0);
  });
  
  // Calculate metrics for each format
  Object.keys(formats).forEach(format => {
    const f = formats[format];
    f.avg_cpa = f.conversions > 0 ? (f.spend / f.conversions).toFixed(2) : null;
    f.avg_ctr = f.impressions > 0 ? (f.clicks / f.impressions * 100).toFixed(2) : 0;
    f.avg_cpc = f.clicks > 0 ? (f.spend / f.clicks).toFixed(2) : 0;
    f.avg_cpm = f.impressions > 0 ? (f.spend / f.impressions * 1000).toFixed(2) : 0;
  });
  
  return formats;
}

// Level 5: Trend Analysis
function analyzeTrends(currentWeek, previousWeeks) {
  const trends = {
    weeks: [],
    insights: []
  };
  
  // Add current week
  const currentSummary = analyzeAccountSummary(currentWeek);
  trends.weeks.push({
    week: 'current',
    ...currentSummary
  });
  
  // Add previous weeks
  previousWeeks.forEach((weekData, index) => {
    const weekSummary = analyzeAccountSummary(weekData);
    trends.weeks.push({
      week: `week_-${index + 1}`,
      ...weekSummary
    });
  });
  
  // Calculate week-over-week changes
  if (trends.weeks.length >= 2) {
    const current = trends.weeks[0];
    const previous = trends.weeks[1];
    
    trends.changes = {
      spend_change: calculatePercentageChange(previous.total_spend, current.total_spend),
      conversions_change: calculatePercentageChange(previous.total_conversions, current.total_conversions),
      cpa_change: calculatePercentageChange(previous.average_cpa, current.average_cpa),
      ctr_change: calculatePercentageChange(previous.average_ctr, current.average_ctr),
      cpm_change: calculatePercentageChange(previous.average_cpm, current.average_cpm)
    };
    
    // Detect anomalies
    if (Math.abs(trends.changes.cpa_change) > 20) {
      trends.insights.push({
        type: 'warning',
        message: `CPA が先週比で ${trends.changes.cpa_change > 0 ? '+' : ''}${trends.changes.cpa_change.toFixed(1)}% 変化`
      });
    }
    
    if (Math.abs(trends.changes.cpm_change) > 30) {
      trends.insights.push({
        type: 'warning',
        message: `CPM が先週比で ${trends.changes.cpm_change > 0 ? '+' : ''}${trends.changes.cpm_change.toFixed(1)}% 変化`
      });
    }
  }
  
  return trends;
}

function calculatePercentageChange(oldValue, newValue) {
  if (oldValue === 0) return 0;
  return ((newValue - oldValue) / oldValue) * 100;
}

// ============================================
// Claude AI Analysis
// ============================================

async function analyzeWithClaude(analysisData, accountName) {
  const prompt = `
以下の広告データを分析して、重要なインサイトと具体的なアクション提案を日本語でまとめてください。

【アカウント】${accountName}
【期間】過去7日間

【データサマリー】
${JSON.stringify(analysisData.summary, null, 2)}

【トップキャンペーン】
${JSON.stringify(analysisData.campaigns?.top_performers || [], null, 2)}

【ワーストキャンペーン】
${JSON.stringify(analysisData.campaigns?.worst_performers || [], null, 2)}

【フォーマット別パフォーマンス】
${JSON.stringify(analysisData.formats || {}, null, 2)}

【トレンド変化】
${JSON.stringify(analysisData.trends?.changes || {}, null, 2)}

以下の形式で分析結果を返してください：

📊 週次広告分析レポート

【サマリー】
（3-4行で全体概要）

【重要なインサイト】
🟢 好調な点: 
🔴 注意が必要な点: 

【具体的なアクション提案】
1. 
2. 
3. 
`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    });
    
    const data = await response.json();
    return data.content[0].text;
  } catch (error) {
    console.error('Claude API error:', error);
    return '分析中にエラーが発生しました。';
  }
}

// ============================================
// Chatwork Notification
// ============================================

async function sendToChatwork(roomId, apiToken, message) {
  try {
    const response = await fetch(`https://api.chatwork.com/v2/rooms/${roomId}/messages`, {
      method: 'POST',
      headers: {
        'X-ChatWorkToken': apiToken,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: `body=${encodeURIComponent(message)}`
    });
    
    if (!response.ok) {
      throw new Error(`Chatwork API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.message_id;
  } catch (error) {
    console.error('Chatwork send error:', error);
    throw error;
  }
}

// ============================================
// Main Analysis Execution
// ============================================

async function executeWeeklyAnalysis() {
  console.log('🚀 Starting weekly analysis...');
  
  try {
    // Get all enabled accounts
    const accountsResult = await pool.query(`
      SELECT 
        a.*,
        c.room_id,
        c.api_token,
        c.enabled as chatwork_enabled,
        m.*,
        al.*
      FROM ad_accounts a
      JOIN chatwork_settings c ON a.id = c.account_id
      JOIN metrics_config m ON a.id = m.account_id
      JOIN analysis_levels_config al ON a.id = al.account_id
      WHERE a.enabled = TRUE 
        AND c.enabled = TRUE
        AND c.schedule = 'weekly'
    `);
    
    console.log(`📊 Found ${accountsResult.rows.length} accounts to analyze`);
    
    for (const account of accountsResult.rows) {
      console.log(`\n📈 Analyzing: ${account.account_name}`);
      
      const startTime = Date.now();
      
      try {
        // Build fields list based on metrics config
        const fields = ['spend', 'impressions', 'clicks', 'ctr', 'cpc', 'cpm'];
        if (account.include_conversions) fields.push('conversions');
        if (account.include_conversion_values) fields.push('conversion_values');
        if (account.include_reach) fields.push('reach');
        if (account.include_frequency) fields.push('frequency');
        if (account.include_roas) fields.push('purchase_roas');
        
        // Fetch data for different levels
        const analysisData = {};
        
        // Level 1: Account Summary
        if (account.include_account_summary) {
          console.log('  → Level 1: Account Summary');
          const accountData = await fetchFacebookData(
            account.account_id,
            'last_7d',
            'account',
            fields
          );
          analysisData.summary = analyzeAccountSummary(accountData.data || []);
        }
        
        // Level 2: Campaign Analysis
        if (account.include_campaign_analysis) {
          console.log('  → Level 2: Campaign Analysis');
          const campaignData = await fetchFacebookData(
            account.account_id,
            'last_7d',
            'campaign',
            fields
          );
          analysisData.campaigns = analyzeCampaigns(
            campaignData.data || [],
            account.campaign_top_count || 3,
            account.campaign_worst_count || 3
          );
        }
        
        // Level 3: Creative Analysis
        if (account.include_creative_analysis) {
          console.log('  → Level 3: Creative Analysis');
          const creativeData = await fetchFacebookData(
            account.account_id,
            'last_7d',
            'ad',
            fields
          );
          analysisData.creatives = analyzeCreatives(
            creativeData.data || [],
            account.creative_per_campaign_count || 5
          );
        }
        
        // Level 4: Format Comparison
        if (account.include_format_comparison) {
          console.log('  → Level 4: Format Comparison');
          const creativeData = await fetchFacebookData(
            account.account_id,
            'last_7d',
            'ad',
            fields
          );
          analysisData.formats = analyzeFormats(creativeData.data || []);
        }
        
        // Level 5: Trend Analysis
        if (account.include_trend_analysis) {
          console.log('  → Level 5: Trend Analysis');
          const weeksBack = account.trend_weeks_back || 4;
          const currentWeekData = await fetchFacebookData(
            account.account_id,
            'last_7d',
            'campaign',
            fields
          );
          
          const previousWeeks = [];
          // Fetch previous weeks data (simplified - in production use proper date ranges)
          for (let i = 1; i <= weeksBack; i++) {
            const weekData = await fetchFacebookData(
              account.account_id,
              'last_14d', // Would calculate proper date range
              'campaign',
              fields
            );
            previousWeeks.push(weekData.data || []);
          }
          
          analysisData.trends = analyzeTrends(currentWeekData.data || [], previousWeeks);
        }
        
        // AI Analysis with Claude
        console.log('  → AI Analysis with Claude');
        const aiInsights = await analyzeWithClaude(analysisData, account.account_name);
        
        // Send to Chatwork
        console.log('  → Sending to Chatwork');
        const decryptedToken = decrypt(account.api_token);
        const messageId = await sendToChatwork(
          account.room_id,
          decryptedToken,
          aiInsights
        );
        
        // Save to database
        const executionTime = Math.floor((Date.now() - startTime) / 1000);
        await pool.query(`
          INSERT INTO analysis_history (
            id, account_id, date_range_start, date_range_end,
            analysis_summary, campaign_analysis, creative_analysis,
            format_comparison, trend_analysis, ai_insights,
            sent_to_chatwork, chatwork_message_id, sent_at,
            execution_time_seconds, success
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), $13, $14)
        `, [
          generateId('history'),
          account.id,
          new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
          new Date(),
          JSON.stringify(analysisData.summary),
          JSON.stringify(analysisData.campaigns),
          JSON.stringify(analysisData.creatives),
          JSON.stringify(analysisData.formats),
          JSON.stringify(analysisData.trends),
          aiInsights,
          true,
          messageId,
          executionTime,
          true
        ]);
        
        console.log(`  ✅ Completed in ${executionTime}s`);
        
        // Log success
        await pool.query(`
          INSERT INTO system_logs (log_level, component, message, details, account_id)
          VALUES ($1, $2, $3, $4, $5)
        `, [
          'INFO',
          'analysis',
          'Weekly analysis completed successfully',
          JSON.stringify({ execution_time: executionTime }),
          account.id
        ]);
        
      } catch (error) {
        console.error(`  ❌ Error analyzing ${account.account_name}:`, error);
        
        // Log error
        await pool.query(`
          INSERT INTO system_logs (log_level, component, message, details, account_id)
          VALUES ($1, $2, $3, $4, $5)
        `, [
          'ERROR',
          'analysis',
          'Weekly analysis failed',
          JSON.stringify({ error: error.message }),
          account.id
        ]);
      }
    }
    
    console.log('\n✅ Weekly analysis completed');
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// ============================================
// Execute
// ============================================

if (require.main === module) {
  executeWeeklyAnalysis()
    .then(() => {
      console.log('🎉 All done!');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { executeWeeklyAnalysis };
