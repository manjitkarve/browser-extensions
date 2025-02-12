// This file contains the background script for the Chrome extension. It handles events and manages the extension's lifecycle.

chrome.runtime.onInstalled.addListener(() => {
    console.log('Extension installed');
});

chrome.runtime.onStartup.addListener(() => {
    console.log('Extension started');
});

chrome.action.onClicked.addListener((tab) => {
  if (tab.url.includes('streak.tech/scanner/')) {
    chrome.tabs.sendMessage(tab.id, {action: "insertColumn"});
  }
  if (tab.url.includes('kite.zerodha.com')) {
    chrome.tabs.sendMessage(tab.id, {action: "toggleSellPricePanel"});
  }
});