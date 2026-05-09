export default defineContentScript({
  matches: ['*://*/*'],
  main() {
    console.log("✅ Content 已注入")

    chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
      if (msg.type === "POPUP_TO_CONTENT") {
        alert(`📩 页面收到消息：\n${msg.data}`)
        sendResponse(`✅ 页面已收到：${msg.data}`)
      }
    })

    chrome.runtime.sendMessage({
      type: "CONTENT_TO_BACKGROUND",
      data: "Content 已成功注入！"
    })
  },
});
