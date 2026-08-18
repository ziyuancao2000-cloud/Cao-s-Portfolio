# Ziyuan Cao Portfolio — 项目交接文档

## 1. 我们正在做什么

这是 Ziyuan Cao 的景观建筑作品集网站预览。网站以一个可交互的 3D 地球作为首页核心，让访问者通过项目所在地浏览作品，也可以从 `Projects` 页面直接查看全部项目卡片。

整体视觉方向是简洁、克制、高级、带艺术感的暗暖灰色空间氛围。地球强调真实地形、柔和光影和虚实变化；项目点必须比地球本体更醒目。

技术栈：

- React + Vite
- Three.js：地球纹理、光照和立体渲染
- Canvas 2D：经纬网、国土轮廓、项目点、同城聚合和命中检测
- `world-atlas` + `topojson-client`：陆地轮廓数据

项目根目录：

`C:\Users\aaa\Documents\ChatGPT\作品集`

## 2. 已完成内容

### 全站结构

- `Index`：姓名、MLA Portfolio、交互地球、作品数量和所在地信息。
- `Projects`：所有项目卡片，只显示项目信息；点击后直接进入完整项目图册，不再出现重复的项目介绍首页。
- `About`：三段个人介绍、LinkedIn 和 Resume 链接。除首页外不显示 “Based in Boston”。
- `Contact`：姓名、邮箱和留言表单；提交后打开预填收件人、主题和正文的 Gmail 写信页面。
- 顶部菜单可以直接切换页面。
- 鼠标滚轮可以按 `Index → Projects → About → Contact` 顺序切换，使用较慢的淡出、淡入过渡；首页只在左侧区域响应换页滚动，避免干扰地球缩放。

### 地球交互

- 地球空闲时自动缓慢自转，鼠标进入或拖动时暂停。
- 支持拖动旋转、滚轮缩放。
- 使用暗暖灰调真实地球纹理、法线贴图、左上方主光和右下方阴影。
- 地球边缘采用较弱的局部轮廓光，放大后左侧使用曲线式虚化过渡，菜单层级保持在地球上方。
- 项目点支持悬停预览和点击进入项目。
- 同一城市有多个项目时，缩小时自动显示白底黑字的项目数量；放大后拆分为独立项目点。
- 项目总数和城市总数从项目数据自动计算，无需手动修改。

### About / Contact 信息

- 姓名：Ziyuan Cao
- 职业：Landscape Designer
- 所在地：首页显示 `Based in Boston · Selected works worldwide`
- LinkedIn：<https://www.linkedin.com/in/ziyuan-cao>
- Resume：<https://drive.google.com/file/d/1Nm101wJLH9GkY8jpZ6NsnvfIGcz0FThh/view?usp=sharing>
- Email：`ziyuancao2000@gmail.com`

### 已录入项目

1. **The Healing Park**
   - Wuhan, China
   - Caidian District · Zhiyin Lake
   - 2023
   - 坐标：`30.53028, 114.08253`
   - 图片目录：`public/images/healing-park/`

2. **Reborn Flower**
   - Antakya, Turkey
   - Habib-i Neccar Mosque · Antakya
   - 2023
   - 坐标：`36.201676, 36.165637`
   - 图片目录：`public/images/reborn-flower/`
   - 五张图按 `01-cover`、`02-context`、`03-design-analysis`、`04-scenarios`、`05-visualizations` 的顺序展示。

## 3. 关键文件

- `src/App.jsx`
  - 页面导航、滚轮换页、淡入淡出状态、首页信息和动态项目/城市数量。
- `src/data/projects.js`
  - 所有项目的唯一数据源。新增项目主要修改此文件。
- `src/components/GlobeCanvas.jsx`
  - 地球渲染、旋转、缩放、经纬度投影、项目点、同城聚合、悬停和点击逻辑。
- `src/components/ProjectPreview.jsx`
  - 地球项目点的悬停卡片；会根据点在屏幕左右的位置自动调整卡片方向。
- `src/components/ProjectsIndex.jsx`
  - Projects 页面卡片列表。
- `src/components/ProjectDetail.jsx`
  - 点击项目后的全屏图册。按照 `gallery` 数组顺序直接展示项目图纸。
- `src/components/AboutPage.jsx`
  - About 文本和职业链接。
- `src/components/ContactPage.jsx`
  - Contact 表单和 Gmail 预填逻辑。
- `src/styles.css`
  - 全站视觉、响应式布局、页面过渡、卡片及详情页样式。
- `public/textures/`
  - 地球表面纹理和法线贴图。
- `public/images/<project-id>/`
  - 每个项目的图片资源。

## 4. 新增项目的标准流程

### 第一步：确认项目资料

每个新项目至少需要：

1. 项目英文名称
2. 城市和国家
3. 尽量精确的具体场地名称或地址
4. 项目年份
5. 项目类型
6. 封面效果图
7. 简短英文项目说明
8. 完整案例图片及展示顺序

如果用户只给城市，项目点可以暂时使用市中心坐标；但最终版本应根据具体场地、地址或地图链接核验准确经纬度，不能凭印象放置。

### 第二步：核验经纬度

- 优先使用具体场地或建筑的公开地图坐标。
- 至少用两个可靠地图或地理数据来源交叉确认。
- 数据格式为十进制度：北纬和东经为正，南纬和西经为负。
- 在地球上实际旋转到对应区域，检查点是否落在正确国家和城市附近。

### 第三步：整理图片

在 `public/images/` 下建立与项目 `id` 一致的目录：

```text
public/images/project-id/
  01-cover.png
  02-analysis.png
  03-strategy.png
  04-design.png
  05-visualizations.png
```

命名原则：

- 使用小写英文、数字和连字符。
- `01-cover` 必须是项目卡片和地球悬停预览使用的封面。
- 后续图片名称应表达内容，并按最终展示顺序编号。
- 保留用户提供的画板比例，不要强制裁切完整项目图纸。
- 大图会直接影响加载速度；正式发布前建议为封面另做压缩缩略图，并合理压缩超大 PNG。

### 第四步：在项目数据中添加对象

编辑 `src/data/projects.js`，在 `projects` 数组中追加：

```js
{
  id: 'project-id',
  city: 'City',
  country: 'Country',
  location: 'Exact Site · City',
  lat: 00.000000,
  lon: 00.000000,
  title: 'Project Title',
  subtitle: 'Short project subtitle',
  year: '2024',
  type: 'Project Type · Secondary Type',
  image: '/images/project-id/01-cover.png',
  gallery: [
    '/images/project-id/01-cover.png',
    '/images/project-id/02-analysis.png',
    '/images/project-id/03-strategy.png',
    '/images/project-id/04-design.png',
    '/images/project-id/05-visualizations.png',
  ],
  description:
    'A concise English description of the project, its site, central strategy and intended experience.',
},
```

注意：

- `id` 必须唯一，并与图片目录一致。
- `city` 拼写必须统一。同一城市的项目依靠完全相同的 `city` 字符串自动聚合。
- `image` 用于 Projects 卡片和地球悬停预览。
- `gallery` 决定详情页的完整展示顺序。
- 目前详情页不会显示 `subtitle` 和 `description`，但数据应保留，便于以后增加文字版项目介绍。
- 不需要手动更新首页项目数、城市数或 Projects 页计数。

### 第五步：本地检查

安装依赖：

```powershell
pnpm install
```

启动开发预览：

```powershell
pnpm dev
```

构建检查：

```powershell
pnpm build
```

固定使用 4173 端口预览构建结果：

```powershell
pnpm preview -- --port 4173
```

### 第六步：逐项验收

新增项目后必须检查：

1. 首页项目总数和城市总数是否自动更新。
2. 地球上项目点是否落在正确地点，并且位于地球正面时可以悬停。
3. 悬停卡片是否显示正确封面、城市、国家、年份和项目名。
4. 左右边缘的项目点悬停是否仍然顺滑，卡片是否留在屏幕内。
5. 点击地球项目点是否直接打开完整项目图册。
6. Projects 页面是否出现新卡片，序号和顺序是否正确。
7. 点击 Projects 卡片是否直接展示第一张项目图，而不是重复介绍页。
8. 详情页图片数量、顺序、清晰度和懒加载是否正确。
9. `Esc` 和右上角关闭按钮是否都能退出详情页。
10. 浏览器控制台是否无报错，`pnpm build` 是否通过。

## 5. 当前实现规则和注意事项

- 项目顺序就是 `projects.js` 数组顺序，Projects 卡片编号也按这个顺序生成。
- 地球初始朝向由 `GlobeCanvas.jsx` 中的 `yaw` 和 `pitch` 决定，不要为了某个新项目随意修改，否则会改变首页整体构图。
- 地球点的经纬度通过正交投影换算，数据只需提供真实 `lat` / `lon`，不要使用屏幕像素手工定位。
- 同城聚合阈值目前是 `zoom < 1.34`；点击聚合数字会放大到至少 `1.55`。
- 项目详情是全屏滚动层；打开详情时全站滚轮换页被暂停。
- 当前图片体积较大，尤其部分完整画板 PNG。继续增加项目时应关注首屏和 Projects 页加载性能。
- 目前没有后端、CMS 或表单数据库；所有项目由代码和本地图片管理，Contact 通过 Gmail 链接完成。

## 6. 当前完成状态

- 两个项目已经写入统一数据结构。
- 项目二 `Reborn Flower` 已按项目一相同格式录入，并配置五张项目图。
- 项目二地点使用 Habib-i Neccar Mosque 的精确坐标，而非安塔基亚市中心的模糊位置。
- 最近一次 Vite production build 已通过；构建仅有常规的大体积 chunk 提示，没有编译错误。

后续工作可直接从“新增项目的标准流程”开始，每次新增一个项目后完成全部十项验收，再继续下一个。

