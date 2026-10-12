# 英语学习网站

线上：https://astemo6.github.io/english-learning/

- **知识学习**：BEC / 雅思 / CET6 / 托福词库（约 1.98 万词），搜索、筛选高频核心词，点 🔊 听英音或美音。
- **背单词**：真正的间隔复习。每个词记录掌握阶段和下次复习时间（20 分钟 → 1 → 2 → 4 → 7 → 15 → 30 → 60 天），先复习到期词再学新词；进度存本机浏览器，可导出 / 导入 JSON 备份。
- **发音训练**：`pronunciation.html`。
- **KK 音标课**：`kk.html`，周育如老师 KK 音标课逐段教案（时间戳可跳到 YouTube 原视频）+ KK 与 IPA 对照。源文件在 `content/`，改完运行 `python3 scripts/build_kk.py`。
- 可安装到手机桌面（PWA），离线可用。

## 目录

| 路径 | 内容 |
| --- | --- |
| `index.html` / `pronunciation.html` | 页面 |
| `assets/app.css`, `assets/app.js` | 样式与逻辑 |
| `data/core.json` | 1,900 个高频核心词（记忆技巧、例句、翻译） |
| `data/{bec,ielts,cet6,toefl}.json` | 全量词表，每行 `[单词, 音标, 释义]` |
| `sw.js`, `manifest.webmanifest`, `icons/` | 离线与安装 |
| `scripts/normalize.py` | 音标统一为现代英式 IPA、释义词性写法统一的规则 |
| `scripts/build.py` | 给资源加内容哈希、生成离线缓存清单 |

改动任何资源后运行 `python3 scripts/build.py` 再提交，确保用户拿到新版本。

## 数据说明

音标统一为现代英式国际音标（Cambridge/Oxford 词典写法：ə、ɜː、eɪ、əʊ、ˈ、ˌ），以 ECDICT 为底本从旧式记法转换；释义词性统一为 n. / v. / vt. / vi. / adj. / adv. 等。来源与许可见 `data/NOTICE.txt`。
