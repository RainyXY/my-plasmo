console.log("✅ Content 已注入")

// 监听 Popup 发来的消息
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "POPUP_TO_CONTENT") {
    alert(`📩 页面收到消息：\n${msg.data}`)
    sendResponse(`✅ 页面已收到：${msg.data}`)
  }
})

// 启动时主动发消息给后台
chrome.runtime.sendMessage({
  type: "CONTENT_TO_BACKGROUND",
  data: "Content 已成功注入！"
})
