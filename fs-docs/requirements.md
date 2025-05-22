## REST APIs

- add watermark

```bash
curl --location 'https://aceswap--facefusion-agent-facefusionagent-index.modal.run' \
--form 'source=@"./src/assets/image.png"' \
--form 'target=@"./src/assets/video.mp4"'
```

```bash
curl --location 'https://aceswap--facefusion-agent-facefusionagent-download-file.modal.run' \
--header 'Content-Type: application/json' \
--data '{"output_path":"/tmp/tmpd0oou2uw/bc7ee887663b4f8d9c9de2967f1988e1.mp4"}'
```

## Fake test file metadata object

```js
const videoTargets = [
  {
    id: 1,
    videoPath: '/videos/1.mp4',
    thumbnail: '/thumbnails/1_thumbnail.webp',
    duration: '0:05',
    author: 'demo',
  },
]
```

## Payment - Stripe

```text
2. 预览会显示在右侧，点击 Checkout 发起支付流程
3. 测试支付：卡号输入 4242 4242 4242 4242，Expiry date 输入任意未来的 MM/YY，cvc 输入任意三位数字
4. 完成支付后跳转回 Success page，可以下载图片

【页面】：
- 首页，generate 页面，登录/注册，个人账户管理，付款成功，付款失败，已购买（方便重新下载）
- 其他网站基础页面 Privacy policies, terms and conditions, about us, FAQ, contact us
【功能】可以根据业务需要调整）
- 用户的注册与登录，仅登录用户
- 预览图片水印（目前 demo 里没有加上）：支持后端返回预览时自动添加水印，用户付款完成后提供无水印的下载链接
- 图片存储在 AWS s3 上，支持  signed URL，可以短时间内过期，避免滥用下载链接
- generate 页面可以根据您 API 参数提供更多设置选项
- 可支持订阅模式。如用户支付月费，在每月享受一定量的生成和下载额度
```

## Payment - Crypto, Coinbase

1. 使用第三方支付网关（如Coinbase Commerce、BitPay），这些服务提供API，处理加密货币支付，用户只需调用接口即可。
2. 直接与区块链网络交互，通过智能合约处理支付，比如使用web3.js或ethers.js库发送交易，并监听交易状态。
