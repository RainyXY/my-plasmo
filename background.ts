// 监听所有消息
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  console.log("Background 收到：", msg, sender)

  switch (msg.type) {
    case "POPUP_TO_BACKGROUND":
      sendResponse(`✅ 后台已收到：${msg.data}`)
      break

    case "CONTENT_TO_BACKGROUND":
      sendResponse(`✅ 后台收到页面消息：${msg.data}`)
      break
  }
})

console.log("Background 已启动")
