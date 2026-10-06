<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/s2b-dev/smart-second-brain/main/assets/logo-dark.svg">
  <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/s2b-dev/smart-second-brain/main/assets/logo-light.svg">
  <img alt="Akıllı İkinci Beyin" src="https://raw.githubusercontent.com/s2b-dev/smart-second-brain/main/assets/logo-light.svg" width="300">
</picture>

# Akıllı İkinci Beyin (Smart Second Brain)

**Notlarınızı gerçekten anlayan, ücretsiz ve açık kaynaklı bir Obsidian eklentisi.**

> **Bu depo bir yerelleştirme (Türkçeleştirme) çalışmasıdır.**
> Orijinal proje [s2b-dev/smart-second-brain](https://github.com/s2b-dev/smart-second-brain)
> ekibi tarafından MIT lisansı altında geliştirilmiştir. Bu depo, o projenin
> **Türkçe arayüz çevirisini ve Türkçe dokümantasyonunu** içeren bir türevidir.
> Tüm mimari, tasarım ve özgün kod telifi orijinal yazarlara aittir.

[![Lisans: MIT](https://img.shields.io/badge/Lisans-MIT-blue.svg)](LICENSE)
[![Sürüm](https://img.shields.io/badge/sürüm-2.3.0-green.svg)](CHANGELOG.md)
[![Obsidian](https://img.shields.io/badge/Obsidian-1.13%2B-7C3AED.svg)](https://obsidian.md)
[![Platform](https://img.shields.io/badge/platform-masaüstü%20%7C%20mobil-lightgrey.svg)](#gereksinimler)
[![Svelte 5](https://img.shields.io/badge/Svelte-5-FF3E00.svg)](https://svelte.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6.svg)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF.svg)](https://vitejs.dev)
[![LangChain](https://img.shields.io/badge/LangChain-LangGraph-1C3C3C.svg)](https://js.langchain.com)

</div>

<br>

## Proje Hakkında

**Akıllı İkinci Beyin**, Obsidian kasasını (vault) gerçek bir ikinci beyne dönüştüren bir eklentidir. Notlarınızı daha iyi arar, aralarındaki ilişkileri görselleştirir ve notlarınızı gerçekten tanıyan bir yapay zekâ asistanı sunar.

Aradığınız notu, yazdığınız kelimeyle değil **kastettiğiniz anlamla** bulur. Akıllı Grafik, notlarınızı bağlantılarına, etiketlerine ve içeriğine göre otomatik olarak konu başlıkları altında gruplar. Asistan ise bu iki kaynağı birlikte kullanarak sorularınızı yanıtlar, notlarınızı okuyup düzenleyebilir ve hatta sizin için canlı grafikler üretebilir.

> **Önemli:** Arama ve Akıllı Grafik, **hiçbir yapay zekâ sağlayıcısı olmadan** anında çalışır. Bir sağlayıcı bağladığınızda ise ajanın tüm yetenekleri açılır. Masaüstünde ve mobilde çalışır.

### Çözdüğü Problem

Büyüyen bir Obsidian kasası zamanla yönetilemez hâle gelir: yüzlerce not, kaybolan bağlantılar ve "bunu nereye yazmıştım?" sorusu. Akıllı İkinci Beyin bu dağınıklığı üç katmanda çözer:

1. **Anlamsal arama** — anahtar kelime eşleşmesinin ötesine geçerek anlamı yakalar.
2. **Otomatik konu gruplama** — kasayı elle düzenleme gerektirmeden konulara ayırır.
3. **Notlarınızı bilen ajan** — bağlamı sizin notlarınızdan alan bir yapay zekâ asistanı.

## Kullanılan Teknolojiler

| Katman | Teknoloji |
| --- | --- |
| Arayüz | [Svelte 5](https://svelte.dev) (runes), [Tailwind CSS](https://tailwindcss.com), [bits-ui](https://bits-ui.com) |
| Dil | [TypeScript 5.9](https://www.typescriptlang.org) |
| Derleme | [Vite 7](https://vitejs.dev) |
| Yapay Zekâ | [LangChain](https://js.langchain.com) / [LangGraph](https://langchain-ai.github.io/langgraphjs/) |
| Vektör Arama | [HNSW](https://github.com/nmslib/hnswlib) (ANN), [MiniSearch](https://github.com/lucaong/minisearch) (BM25) |
| Grafik | [PixiJS](https://pixijs.com), [d3-force](https://d3js.org), [leiden-ts](https://github.com/CWTSLeiden/leiden-ts) |
| Test | [Vitest](https://vitest.dev), [jsdom](https://github.com/jsdom/jsdom) |
| Lint / Format | [Biome](https://biomejs.dev) |
| Paket Yöneticisi | [Bun](https://bun.sh) |

## Öne Çıkan Özellikler

- **🔍 Anlamsal Arama** — Anahtar kelime eşleşmesini anlamla birleştirir; aradığınız notu, yazdığınız kelimeyle değil kastettiğiniz anlamla bulur.
- **🕸️ Akıllı Grafik** — Notlarınızı bağlantılarına, etiketlerine ve yazdıklarınıza göre otomatik olarak konu başlıkları altında gruplar. Bakım gerektirmez.
- **🤖 Ajanlar** — Notlarınızı okur ve yazar, bunlardan canlı grafikler ve panolar üretir. Beceriler (skills), hafıza, MCP desteği ve diğer eklentilerle entegrasyon sunar.
- **🧠 Çoklu Sağlayıcı Desteği** — OpenAI, Ollama, oMLX, Anthropic, OpenRouter ve OpenAI uyumlu uç noktalar. Sağlayıcıdan bağımsız mimari.
- **📱 Masaüstü ve Mobil** — Aynı eklenti her iki platformda da çalışır (`isDesktopOnly: false`).
- **🔒 Gizlilik Öncelikli** — Verileriniz varsayılan olarak makinenizden çıkmaz. Telemetri yoktur; notlarınız yalnızca sizin yapılandırdığınız sağlayıcılara gider.
- **⚡ Hibrit Getirim** — Vektör (HNSW) ve sözcüksel (BM25) aramayı birleştirir; gömme modeli olmadan da çalışır.

## Kurulum

### Gereksinimler

- **Obsidian** 1.13 veya üzeri (masaüstü veya mobil)
- **Node.js** 22+ (yalnızca geliştirme için)
- **Bun** paket yöneticisi (yalnızca geliştirme için) — [kurulum](https://bun.sh/docs/installation)

### Kullanıcı Olarak Kurulum

1. Obsidian'ı açın ve **Ayarlar → Topluluk Eklentileri** bölümüne gidin.
2. **Gözat** düğmesine tıklayın ve **Smart Second Brain** eklentisini arayın.
3. **Yükle** ve ardından **Etkinleştir** düğmesine tıklayın.
4. Arama ve Akıllı Grafik hiçbir yapılandırma gerektirmeden hemen çalışır.

Anlamsal arama ve konu gruplama için bir **gömme (embedding) modeli**, ajanı etkinleştirmek için bir **yapay zekâ sağlayıcısı** ekleyin.

### Geliştirici Olarak Kurulum

```bash
# 1. Depoyu klonlayın
git clone https://github.com/s2b-dev/smart-second-brain.git
cd smart-second-brain

# 2. Bağımlılıkları yükleyin (Bun önerilir)
bun install

# 3. Geliştirme derlemesini başlatın (izleme modu)
bun run dev
```

Derleme çıktısı `build/smart-second-brain/` klasörüne yazılır. Eklentiyi Obsidian'da görmek için bu klasörü kasanızın `.obsidian/plugins/` dizinine bağlayın (symlink) veya kopyalayın.

> **Not:** Bu eklenti bir web uygulaması değildir; `localhost` üzerinde çalışan bir önizleme sunmaz. Arayüzü yalnızca Obsidian içinde görebilirsiniz.

## Çalıştırma

```bash
# Geliştirme modu — build/smart-second-brain/ klasörüne izlemeli derleme
bun run dev

# Üretim derlemesi — build/prod klasörüne küçültülmüş çıktı
bun run build

# Tip kontrolü (src ve test)
bun run check

# Kod biçimlendirme (Biome)
bun run format

# Lint (güvenli otomatik düzeltmeler)
bun run lint

# Birim testleri
bun run test

# Entegrasyon testleri (canlı Obsidian örneği gerektirir)
bun run test:integration
```

### Test Kasasını Kurma

```bash
# 1. Üretim derlemesi alın
bun run build

# 2. Test kasasına eklentiyi bağlayın (tek seferlik)
bun run setup-vault

# 3. integration/S2B Test Vault klasörünü Obsidian'da açın ve eklentiyi etkinleştirin
```

## Katkıda Bulunma

Katkılarınızı memnuniyetle karşılıyoruz:

- **Hata bildirimi** veya **özellik isteği** için [issue açın](https://github.com/s2b-dev/smart-second-brain/issues/new/choose).
- **Soru sormak** için [Q&A](https://github.com/s2b-dev/smart-second-brain/discussions/categories/q-a) bölümünü kullanın.
- **Beceri, ajan veya iş akışı paylaşmak** için [Show and tell](https://github.com/s2b-dev/smart-second-brain/discussions/categories/show-and-tell) bölümüne göz atın.
- **Pull request** gönderebilirsiniz. Geliştirme ortamı ve yapay zekâ destekli katkı politikası için [CONTRIBUTING.md](CONTRIBUTING.md); mimari, komutlar ve kod kuralları için [AGENTS.md](AGENTS.md) dosyasına bakın.

Bu proje başlangıçta bir üniversite projesi olarak geliştirildi. Kodun büyük bir kısmı yapay zekâ kodlama ajanlarıyla yazılmaktadır; her değişikliği inceliyor, test ediyor ve arkasında duruyoruz. Commit'ler ve pull request'ler bir ajanın dâhil olduğunu açıkça belirtir.

## Lisans

Bu proje [MIT Lisansı](LICENSE) altında lisanslanmıştır.

---

<div align="center">

**[smartsecondbrain.dev](https://smartsecondbrain.dev)** — demo videosu, özellikler, kurulum kılavuzları ve dokümantasyon.

</div>
