## REST APIs

```text
  $ modal deploy facefusion_agent.py

✓ Created objects.
  ├─ 🔨 Created mount /Users/jinpeng/python/modal/facefusion/facefusion_agent.py
  ├─ 🔨 Created function FaceFusionAgent.*
  ├─ 🔨 Created web endpoint for FaceFusionAgent.download_file => https://aceswap--facefusion-agent-facefusionagent-download-file.modal.run
  ├─ 🔨 Created web endpoint for FaceFusionAgent.index => https://aceswap--facefusion-agent-facefusionagent-index.modal.run
✓ App deployed in 3.397s! 🎉
```

View Deployment: https://modal.com/apps/aceswap/main/deployed/facefusion-agent

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
