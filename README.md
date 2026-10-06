<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/s2b-dev/smart-second-brain/main/assets/logo-dark.svg">
  <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/s2b-dev/smart-second-brain/main/assets/logo-light.svg">
  <img alt="Akıllı İkinci Beyin" src="https://raw.githubusercontent.com/s2b-dev/smart-second-brain/main/assets/logo-light.svg" width="300">
</picture>

# Akıllı İkinci Beyin (Smart Second Brain) — Türkçe sürüm

**Notlarınızı gerçekten anlayan, ücretsiz ve açık kaynaklı bir Obsidian eklentisinin Türkçe fork'u.**

[![Lisans: MIT](https://img.shields.io/badge/Lisans-MIT-blue.svg)](LICENSE)
[![Sürüm](https://img.shields.io/badge/sürüm-2.3.1-green.svg)](CHANGELOG.md)
[![Yerelleştirme kapısı](https://img.shields.io/badge/l10n%3Acheck-ye%C5%9Fil-brightgreen.svg)](docs/l10n.md)
[![Obsidian](https://img.shields.io/badge/Obsidian-1.11%2B-7C3AED.svg)](https://obsidian.md)
[![Svelte 5](https://img.shields.io/badge/Svelte-5-FF3E00.svg)](https://svelte.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6.svg)](https://www.typescriptlang.org)

</div>

> **Bu depo bir yerelleştirme (Türkçeleştirme) çalışmasıdır.**
> Orijinal proje [s2b-dev/smart-second-brain](https://github.com/s2b-dev/smart-second-brain) —
> yazarlar **Leo310** ve **nicobrauchtgit** — MIT lisansı altındadır. Tüm mimari, tasarım ve özgün
> kod telifi onlara aittir. Bu fork arayüzü ve dokümantasyonu Türkçeleştirir **ve yerelleştirmeyi
> ölçülebilir, denetlenebilir hâle getirir**.
>
> Orijinal projeyle resmî bir bağı yoktur; upstream kaynaklı hatalar için lütfen
> [orijinal depoda](https://github.com/s2b-dev/smart-second-brain/issues) issue açın.

---

## Bu fork neyi değiştiriyor (ölçülmüş)

| Konu | Durum | Nasıl doğrularsınız |
| --- | --- | --- |
| Arayüz metinleri | Ölçülen **90** metnin **77'si Türkçe**; 9'u kasıtlı istisna (örnek API anahtarı, örnek URL, örnek not başlığı, ürün adı), 4'ü salt kod yer tutucusu | `bun run l10n:check` |
| i18n katmanı | `en` + `tr` kayıtlı; Obsidian arayüz dili algılanır (`tr-TR → tr`), desteklenmeyen dil İngilizceye düşer | `src/lib/i18n.ts` |
| Yerelleştirme kapısı | Anahtar paritesi, yer tutucu paritesi, boş değer denetimi + **onay listesi dışı yeni İngilizce metin** çıkarsa hata; CI'da koşar | `scripts/l10n-qa.mjs` · [docs/l10n.md](docs/l10n.md) |
| Testler | **1989/1989** geçiyor (fork'ta geçersiz kalan iki test gerçek duruma göre düzeltildi) | `bun run test` |
| CI | Kurulum (frozen lockfile), yerelleştirme kapısı, biçim/lint (Biome), tip denetimi (svelte-check), testler, üretim derlemesi | Actions sekmesi |

Yerelleştirmenin nasıl sürdürüldüğü, yeni dil ekleme ve **upstream'den güncelleme alırken** ne yapılacağı:
[docs/l10n.md](docs/l10n.md).

## Proje Hakkında

**Akıllı İkinci Beyin**, Obsidian kasanızı (vault) gerçek bir ikinci beyne dönüştürür. Aradığınız notu,
yazdığınız kelimeyle değil **kastettiğiniz anlamla** bulur. Akıllı Grafik, notlarınızı bağlantılarına,
etiketlerine ve içeriğine göre otomatik olarak konu başlıkları altında gruplar. Asistan ise bu iki
kaynağı birlikte kullanarak sorularınızı yanıtlar, notlarınızı okuyup düzenleyebilir ve sizin için canlı
grafikler üretebilir.

> **Önemli:** Arama ve Akıllı Grafik, **hiçbir yapay zekâ sağlayıcısı olmadan** anında çalışır. Bir
> sağlayıcı bağladığınızda ise ajanın tüm yetenekleri açılır. Masaüstünde ve mobilde çalışır.

### Çözdüğü Problem

Büyüyen bir Obsidian kasası zamanla yönetilemez hâle gelir: yüzlerce not, kaybolan bağlantılar ve
"bunu nereye yazmıştım?" sorusu. Akıllı İkinci Beyin bu dağınıklığı üç katmanda çözer:

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
| Biçim / Lint | [Biome](https://biomejs.dev) |
| Paket Yöneticisi | [Bun](https://bun.sh) |

## Öne Çıkan Özellikler

- **🔍 Anlamsal Arama** — Anahtar kelime eşleşmesini anlamla birleştirir.
- **🕸️ Akıllı Grafik** — Notları bağlantı, etiket ve içeriğe göre otomatik gruplar; bakım gerektirmez.
- **🤖 Ajanlar** — Notları okur ve yazar, canlı grafik ve pano üretir; beceri (skill), hafıza ve MCP desteği sunar.
- **🧠 Çoklu Sağlayıcı Desteği** — OpenAI, Ollama, oMLX, Anthropic, OpenRouter ve OpenAI uyumlu uç noktalar.
- **📱 Masaüstü ve Mobil** — Aynı eklenti her iki platformda da çalışır (`isDesktopOnly: false`).
- **🔒 Gizlilik Öncelikli** — Verileriniz varsayılan olarak makinenizden çıkmaz; telemetri yoktur.
- **⚡ Hibrit Getirim** — Vektör (HNSW) ve sözcüksel (BM25) aramayı birleştirir; gömme modeli olmadan da çalışır.

## Kurulum

### Bu fork'u kurma

Obsidian'ın topluluk eklenti dizininde **orijinal** sürüm listelenir; bu fork listelenmez. Bu sürümü
kurmak için [Releases](../../releases) sayfasındaki son sürümden üç dosyayı indirip eklenti klasörüne
kopyalayın:

```
main.js  ·  manifest.json  ·  styles.css   →   <kasa>/.obsidian/plugins/smart-second-brain/
```

Sonra Obsidian'ı yeniden başlatıp **Ayarlar → Topluluk Eklentileri** bölümünden eklentiyi etkinleştirin.
(BRAT gibi yardımcı bir yükleyici de kullanabilirsiniz.)

> **Not:** Eklenti kimliği orijinalle aynıdır (`smart-second-brain`); bu yüzden orijinal sürümle aynı
> kasada aynı anda kurulamaz, birini seçmeniz gerekir.

### Gereksinimler

- **Obsidian** 1.11.4 veya üzeri (masaüstü veya mobil)
- **Bun** paket yöneticisi (yalnızca geliştirme için) — [kurulum](https://bun.sh/docs/installation)

### Geliştirici Olarak Kurulum

```bash
git clone https://github.com/acar32furkan-glitch/smart-second-brain-tr.git
cd smart-second-brain-tr
bun install
bun run dev        # izlemeli geliştirme derlemesi
```

Derleme çıktısı `build/smart-second-brain/` klasörüne yazılır. Eklentiyi Obsidian'da görmek için bu
klasörü kasanızın `.obsidian/plugins/` dizinine bağlayın (symlink) veya kopyalayın.

> **Not:** Bu eklenti bir web uygulaması değildir; `localhost` üzerinde çalışan bir önizleme sunmaz.
> Arayüzü yalnızca Obsidian içinde görebilirsiniz.

## Kalite kapıları ve doğrulama

```bash
bun run l10n:check   # yerelleştirme kapısı: en/tr parite, yer tutucu, kapsam ölçümü
bun run lint         # Biome lint
bun run check        # svelte-check tip denetimi (0 hata / 0 uyarı)
bun run test         # 1989 birim testi
bun run build        # üretim derlemesi (build/prod)
```

`bun run l10n:check` ölçümü doğrudan gösterir: taranan metin, Türkçe görünen, onay listesindeki
istisnalar ve **onay listesi dışı yeni İngilizce metin** sayısı. Yeni bir istisna gerekiyorsa
`scripts/l10n-allowlist.json` içine **gerekçesiyle** eklenir; gerekçesiz istisna kabul edilmez.

### Test Kasasını Kurma

```bash
bun run build
bun run setup-vault    # integration/S2B Test Vault klasörüne eklentiyi bağlar
```

Ardından `integration/S2B Test Vault` klasörünü Obsidian'da açıp eklentiyi etkinleştirin.

## Katkıda Bulunma

- **Upstream kaynaklı hata veya özellik isteği** → [orijinal depo](https://github.com/s2b-dev/smart-second-brain/issues/new/choose)
- **Çeviri, yerelleştirme kapısı veya bu fork'a özgü konular** → bu depoda issue açın
- Geliştirme ortamı ve kod kuralları: [CONTRIBUTING.md](CONTRIBUTING.md) · [AGENTS.md](AGENTS.md)
- Yerelleştirme kuralları: [docs/l10n.md](docs/l10n.md)

## Lisans ve Atıf

Bu proje [MIT Lisansı](LICENSE) altındadır. Telif hakkı orijinal yazarlara (Leo310, nicobrauchtgit)
aittir; bu fork'un çeviri, dokümantasyon ve yerelleştirme altyapısı eklemeleri de aynı lisans
kapsamındadır.

---

<div align="center">

**[smartsecondbrain.dev](https://smartsecondbrain.dev)** — orijinal projenin tanıtımı, özellikleri ve dokümantasyonu.

</div>
