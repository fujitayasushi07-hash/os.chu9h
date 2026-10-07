/**
 * CHOG Finance Phase 4 - Enhanced Implementation
 * 
 * This module provides the foundation for:
 * - Internal navigation (Dashboard, Assets, CHOG, NFTs, Activity)
 * - NFT Explorer with real GoldRush data
 * - CHOG Diagnostics view
 * - Persistent state management within the window
 */

/**
 * Helper functions for Phase 4
 */
const CHOG_CONTRACT = '0x350035555e10d9afaf1566aaebfced5ba6c27777';

function formatUSD(value) {
    if (!value || value === 0) return '$0.00';
    return '$' + parseFloat(value).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: value < 1 ? 8 : 2
    });
}

function formatLargeNumber(num) {
    if (!num) return '$0';
    const parsedNum = Number(String(num).replace(/,/g, ""));
    if (isNaN(parsedNum)) return '$0';
    if (parsedNum >= 1000000000) return '$' + (parsedNum / 1000000000).toFixed(2) + 'B';
    if (parsedNum >= 1000000) return '$' + (parsedNum / 1000000).toFixed(2) + 'M';
    if (parsedNum >= 1000) return '$' + (parsedNum / 1000).toFixed(2) + 'K';
    return '$' + parsedNum.toFixed(2);
}

/**
 * Navigation state and content renderers
 */
const ChogFinanceState = {
    currentSection: 'dashboard',
    walletAddress: null,
    walletData: null,
    selectedNFT: null,
    
    setSectionContent(win, section) {
        this.currentSection = section;
        const contentArea = win.querySelector('#chog-content-area');
        if (!contentArea) return;
        
        // Clear and render new content
        contentArea.innerHTML = '';
        
        switch(section) {
            case 'dashboard':
                this.renderDashboard(win, contentArea);
                break;
            case 'assets':
                this.renderAssets(win, contentArea);
                break;
            case 'chog':
                this.renderChogSection(win, contentArea);
                break;
            case 'nfts':
                this.renderNFTs(win, contentArea);
                break;
            case 'activity':
                this.renderActivity(win, contentArea);
                break;
        }
    },
    
    renderDashboard(win, container) {
        const html = `
            <div style="font-size:11px;color:#000;">
                <div style="font-weight:bold;margin-bottom:12px;font-size:12px;">WALLET INSPECTOR</div>
                <div style="margin-bottom:12px;">
                    <input type="text" id="chog-wallet-address" placeholder="Enter Monad wallet address..." style="width:100%;padding:4px 6px;font-size:11px;box-sizing:border-box;border:inset 1px #808080;font-family:monospace;">
                </div>
                <button id="chog-inspect-btn" style="padding:4px 12px;font-size:11px;margin-bottom:12px;cursor:pointer;">INSPECT WALLET</button>
                <div id="chog-loading" style="display:none;font-size:10px;color:#666;margin-bottom:8px;">Loading...</div>
                <div id="chog-error" style="display:none;font-size:10px;color:#c00;margin-bottom:8px;padding:6px;background:#fee;border:1px solid #c00;"></div>
                
                <div id="chog-balance-result" style="display:none;font-size:11px;color:#000;margin-bottom:8px;padding:8px;background:#efe;border:1px solid #0c0;">
                    <div style="font-weight:bold;margin-bottom:4px;">Native Balance:</div>
                    <div style="font-size:13px;font-family:monospace;"><span id="chog-balance-value">0</span> MON</div>
                </div>
                
                <div id="chog-tokens-result" style="display:none;font-size:11px;color:#000;margin-bottom:8px;padding:8px;background:#efe;border:1px solid #0c0;">
                    <div style="font-weight:bold;margin-bottom:6px;">Token Holdings:</div>
                    <table id="chog-tokens-table" style="width:100%;border-collapse:collapse;font-size:10px;">
                        <thead>
                            <tr style="border-bottom:1px solid #0c0;">
                                <th style="text-align:left;padding:2px;border-right:1px solid #ddd;">Symbol</th>
                                <th style="text-align:right;padding:2px;border-right:1px solid #ddd;">Balance</th>
                                <th style="text-align:right;padding:2px;">USD Value</th>
                            </tr>
                        </thead>
                        <tbody id="chog-tokens-body">
                        </tbody>
                    </table>
                    <div id="chog-tokens-empty" style="font-size:10px;color:#666;margin-top:4px;">No token holdings</div>
                </div>
                
                <div id="chog-position-panel" style="display:none;margin-top:12px;background:#fff;border:inset 2px #dfdfdf;padding:12px;">
                    <div style="font-size:12px;font-weight:bold;margin-bottom:8px;color:#000;">CHOG</div>
                    
                    <div style="background:#efe;border:1px solid #0c0;padding:8px;margin-bottom:8px;">
                        <div style="font-size:13px;font-family:monospace;font-weight:bold;" id="chog-balance-display">0 CHOG</div>
                        <div style="font-size:14px;font-family:monospace;font-weight:bold;color:#080;" id="chog-value-display">$0.00</div>
                    </div>
                    
                    <div id="chog-market-loading" style="display:none;font-size:10px;color:#666;">Loading market data...</div>
                    
                    <div id="chog-market-panel" style="display:none;font-size:11px;background:#e8f0ff;border:1px solid #008;padding:8px;margin-bottom:8px;">
                        <div style="font-weight:bold;margin-bottom:6px;color:#000;">CHOG MARKET</div>
                        <div style="margin-bottom:3px;color:#000;"><strong>Price:</strong> <span id="chog-price-display">$0.00</span></div>
                        <div style="margin-bottom:3px;color:#000;"><strong>24H Change:</strong> <span id="chog-change-display" style="color:#080;">0%</span></div>
                        <div style="margin-bottom:3px;color:#000;"><strong>Market Cap:</strong> <span id="chog-mcap-display">$0</span></div>
                        <div style="color:#000;"><strong>24H Volume:</strong> <span id="chog-volume-display">$0</span></div>
                    </div>
                    
                    <div id="chog-chart-container" style="display:none;border:inset 1px #808080;background:#fff;padding:8px;margin-bottom:8px;">
                        <canvas id="chog-price-chart" style="width:100%;height:120px;display:block;"></canvas>
                    </div>
                </div>
            </div>
        `;
        container.innerHTML = html;
    },
    
    renderAssets(win, container) {
        const html = `
            <div style="font-size:11px;color:#000;">
                <div style="font-weight:bold;margin-bottom:12px;font-size:12px;">ASSETS</div>
                <div id="assets-content" style="font-size:10px;">Loading wallet data...</div>
            </div>
        `;
        container.innerHTML = html;
    },
    
    renderChogSection(win, container) {
        const html = `
            <div style="font-size:11px;color:#000;">
                <div style="font-weight:bold;margin-bottom:12px;font-size:12px;">CHOG TOKEN</div>
                <div id="chog-detail-content" style="font-size:10px;">Load wallet data from Dashboard first.</div>
            </div>
        `;
        container.innerHTML = html;
    },
    
    renderNFTs(win, container) {
        const html = `
            <div style="font-size:11px;color:#000;">
                <div style="font-weight:bold;margin-bottom:12px;font-size:12px;">CHOG NFT EXPLORER</div>
                <div id="nft-explorer-content" style="font-size:10px;">
                    <div style="margin-bottom:8px;">Load wallet data from Dashboard first to view NFTs.</div>
                    <div id="nft-list" style="display:none;"></div>
                    <div id="nft-detail" style="display:none;"></div>
                </div>
            </div>
        `;
        container.innerHTML = html;
    },
    
    renderActivity(win, container) {
        const html = `
            <div style="font-size:11px;color:#000;">
                <div style="font-weight:bold;margin-bottom:12px;font-size:12px;">ACTIVITY</div>
                <div id="activity-content" style="font-size:10px;color:#666;">
                    Transaction history coming in Phase 5.
                </div>
            </div>
        `;
        container.innerHTML = html;
    }
};
