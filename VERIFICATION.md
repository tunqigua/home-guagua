# 上轮验收记录（赞赏设计更新前）— 2026-11-02

本次赞赏更新的验收及原图信息见 `SUPPORT-VERIFICATION.md`。以下保留此前记录。

## 站点与范围

沿用 `appgprj_6ae8192581b08191ab8d69720baef432` 及原站地址 https://brain-room-cozy-1102.tunqigua.chatgpt.site/ 。Sites 当前访问范围为 public，权限配置允许普通访客访问。本轮不调用权限修改操作。发布后本环境的匿名 HTTP 请求收到 Cloudflare 403，线上浏览器自动检查超时，因此普通访客实际连通性未能独立验证。

## 自动检查

- Node.js 22.16：11 项测试通过。穷举全部 65,536 组答案，以独立计数方式验证并列从后向前判定；保留旧样例结果与八类映射。
- 分享 v2 白名单往返、旧 v1 链接、未知/重复/缺失/非法参数拦截、URL 其他参数清除通过。
- 默认 session、主动 local 记住与关闭、旧长期答案迁移、失败时保留旧记录、本站键清理及无关键保留通过。
- 第八题四种初始小物、八类场景的确定性与灯光/窗帘/摆件变化通过。
- 静态资源与全部七个 JS 模块语法检查通过，git diff --check 通过。

## 真实浏览器运行

使用 Codex 内置浏览器打开本地真实应用及独立测试夹具 `tests/runtime.html`，测试夹具不进入部署产物。

1. 全部八题点选后自动前进；方向键移动不提交，Enter 确认。返回可改答，也可点击原答案继续。模拟双击与跨题连点，不误答下一题。离开时取消待跳题任务。
2. 每题仅注册一个 60,000ms 毛球定时器；滚动重置、后台取消、前台重新开始、离开清理。另在正常页面真实停留后观察到瓜瓜与毛球。时间和轨迹不进入存储或分享。
3. 第八题直接生成结果，局部八块厚雪揭晓；跳过和自然完成均清除雪层，重复打开结果不重播。减少动态效果设置直接展示结果。另通过 tests/failures.html 注入图片解码不返回、解码拒绝和 CSS 动画不执行，三种情形均自动清理雪层，真实场景可见、操作区可用。
4. 灯光、窗帘、三个小物位置、门牌话即时生效。恢复初始保留房型。访客改动仅在访客副本，本人草稿/结果不被覆盖。
5. 新快照恢复完整配置；旧房型链接可用，新访客直接进入第一题。
6. 系统分享成功、取消和失败通过模拟。取消不弹窗；失败直接尝试复制，复制失败展示手动链接。
7. 两种不同的答题序列、装扮和清除期间，监测 fetch/XHR/beacon，没有应用上传请求；Resource Timing 资源仅来自本站或 data URI，静态服务器只记录本地 GET。生产应用源码没有上述网络发送调用，没有第三方追踪或在线 AI。
8. 检查实际 session/local：完成后草稿为空，不残留完整答案；默认不新增长期小屋；开启只保存最小展示配置，关闭删除对应记录；旧答案迁移后删除旧键。存储全部拒绝仍可在内存答完和装扮。
9. 清除删除本站三个键在两个存储域中的记录，测试无关键仍在。下载和分享快照不宣称能撤回。
10. 真实生成并解码八张不同的 1080 × 1440 PNG，使用非默认灯光、窗帘、摆件与第三句门牌话；尺寸、内容下边界均通过。实际检查热汤小厨房海报排版，瓜瓜与小钥匙清晰，门牌话完整。Canvas 图片失败模拟没有假成功，也不影响后续装扮。
11. 320 / 375 / 768px 真实 iframe 布局无横向溢出，控件均在画面内；另直接检查 320px 结果页与 375px 首页、题目，手机首屏可见标题、瓜瓜、暖窗和开始按钮。
12. 未配置赞赏入口隐藏，测试图片加载成功才展示，图片失败不展示。没有支付状态或虚构人数。

## 素材与隐私

瓜瓜及八类场景使用本地生成的像素 SVG，所有场景沿用同一瓜瓜形象、红围巾与固定位置；PNG 与页面共用 scene.js 和白名单配置。没有外部字体、远程图片或用户答题过程中的图片生成请求。

默认会话保存，长期保存需要主动开启。旧记录替代写入失败时会保留原记录以防丢失，并提示存储不可用；浏览器完全禁止存储访问时，无法保证删除其拒绝访问的旧数据。托管平台基础访问日志不在应用控制范围内，页面已如实说明。

## 尚未验证

未在 iPhone Safari、Android Chrome、微信内置浏览器真机检查。系统分享与权限失败使用夹具模拟；真机分享界面、相册保存/长按、后台行为和低性能设备的动画流畅度尚未验证。没有真实赞赏码，未测试支付 App 扫码或付款。未加入广告或统计服务。

## 发布结果

Sites 已确认本轮部署成功，继续使用原地址。线上额外复查受上述 Cloudflare 与浏览器访问限制影响；本地完整验收结果不等同于已完成生产环境或真机验收。


## HOME and four languages (2026-11-02)

- Site identity, public audience, v1/v2 sharing routes, scoring, stored room configuration, and the enabled original support image are preserved.
- Canonical locale IDs are zh-Hans, zh-Hant, ja, en. First use, invalid IDs, and failed reads use zh-Hans. Only the separate local home:language key stores the explicit choice. No browser locale, location, or IP detection.
- UI text and accessibility bindings update in place. Quiz question/options, selected answer, result, room decoration, plaque index, idle cat animation, result snow, and support thank-you DOM are preserved.
- UI, 8 questions / 32 options, 8 room descriptions / 24 plaques, decoration labels, dialogs, privacy, support, native sharing and poster text have four translations. HOME is unchanged; cat names are 瓜瓜 / グアグア / Guagua.
- Support remains enabled, using the author’s original local image. Amounts are actual CNY; no currency conversion or payment confirmation is introduced.
- Posters measure all text at readable sizes, wrap English words and Japanese punctuation, and grow the canvas when needed.
- Passed 16 Node tests, including all 65,536 answer combinations, old/new share round trips, isolated language storage, catalog coverage, English script coverage, and poster line wrapping.
- Actual browser tests in tests/i18n.html passed: defaults, remembered preference on reopen, option text, quiz state, playing-cat identity, result/decor/plaque identity, one-time snow, local-only preference writes, 320/375/768px layout, share, poster dialogs, CNY support, thank-you animation identity, visitor language, and v1 links. All 32 posters generated and decoded. Traditional Chinese, Japanese and English exports were visually inspected.
- Existing tests/runtime.html passed: keyboard navigation, rapid clicks, back navigation, idle animation lifecycle, answer cleanup, local remembering, snapshot isolation, native sharing success/cancel/error simulation, blocked-storage fallback, failed-image fallback, reduced motion, and responsive layout.
- Browser tests used the local preview. Physical phone and external social-app preview caches are not tested.
