<script lang="ts">
import { Notice } from "obsidian";
import SettingGroup from "../../components/settings/SettingGroup.svelte";
import SettingItem from "../../components/settings/SettingItem.svelte";
import SecretSelect from "../../components/settings/SecretSelect.svelte";
import Button from "../../components/ui/Button.svelte";
import Text from "../../components/ui/Text.svelte";
import Toggle from "../../components/ui/Toggle.svelte";
import { createObsidianFetch } from "../../lib/obsidianFetch";
import { suggestSecretId } from "../../lib/secretStorage";
import { getData } from "../../stores/dataStore.svelte";
import { getPlugin } from "../../stores/state.svelte";
import { VIEW_TYPE_ONBOARDING } from "../onboarding/OnboardingView";

const pluginData = getData();
const plugin = getPlugin();
const DEFAULT_LANGSMITH_ENDPOINT = "https://api.smith.langchain.com";
let langSmithEndpointDraft = $state(pluginData.langSmithEndpoint);
let langSmithCheckState = $state<"idle" | "pending" | "success" | "error">("idle");
let langSmithCheckMessage = $state("LangSmith bağlantısını kontrol et");

$effect(() => {
	if (langSmithCheckState !== "pending") {
		langSmithEndpointDraft = pluginData.langSmithEndpoint;
	}
});

function replayOnboardingIntro() {
	pluginData.onboardingSplashSeen = false;
	pluginData.onboardingComplete = false;

	// activateOnboardingView reveals an existing Welcome leaf rather than remounting
	// it, so if one is already open (likely, in a dev vault) the flag reset above
	// would silently not replay anything — playIntro is only computed once, at the
	// Svelte component's construction. Detach any existing leaf first to force a
	// fresh mount; this is specific to this dev action, not activateOnboardingView
	// itself, since the real "reveal what's already open" behavior is correct for
	// the startup auto-open.
	for (const leaf of plugin.app.workspace.getLeavesOfType(VIEW_TYPE_ONBOARDING)) {
		leaf.detach();
	}

	// Startup auto-open also requires zero configured providers (see main.ts), which
	// a dev/test vault rarely has — so resetting the flags alone would silently do
	// nothing visible here. Open it directly instead of waiting on that gate; this
	// also closes Settings first (activateOnboardingView's own behavior), matching
	// what a real first run looks like when the plugin is enabled from Settings.
	void plugin.activateOnboardingView();
	new Notice("Karşılama sıfırlandı ve yeniden açıldı — tanıtım baştan oynatılacak.");
}

function restoreDismissedRecommendations() {
	const count = pluginData.dismissedRecommendations.length;
	pluginData.restoreDismissedRecommendations();
	new Notice(count > 0 ? `${count} kapatılmış öneri geri getirildi.` : "Geri getirilecek kapatılmış öneri yok.");
}

function restoreIntegrationPrivacyWarning() {
	const wasSuppressed = pluginData.suppressIntegrationPrivacyWarning;
	pluginData.suppressIntegrationPrivacyWarning = false;
	new Notice(
		wasSuppressed
			? "Entegrasyon gizlilik uyarısı geri getirildi — bir entegrasyon etkinleştirildiğinde tekrar gösterilecek."
			: "Entegrasyon gizlilik uyarısı bastırılmamıştı.",
	);
}

function getLangSmithCheckIcon(): string {
	if (langSmithCheckState === "success") return "check-circle";
	if (langSmithCheckState === "error") return "x-circle";
	return "refresh-cw";
}

function getLangSmithCheckButtonStyles(): string {
	if (langSmithCheckState === "success") return "langsmith-check-button is-success";
	if (langSmithCheckState === "error") return "langsmith-check-button is-error";
	if (langSmithCheckState === "pending") return "langsmith-check-button is-pending";
	return "langsmith-check-button";
}

function normalizeLangSmithEndpoint(endpoint: string): string {
	return (endpoint.trim() || DEFAULT_LANGSMITH_ENDPOINT).replace(/\/+$/, "");
}

async function handleCheckLangSmithConnection() {
	const apiKey = pluginData.langSmithApiKey;
	if (!pluginData.langSmithApiKeyId || !apiKey) {
		langSmithCheckState = "error";
		langSmithCheckMessage = "Önce bir LangSmith API anahtarı gizli değeri seçin";
		new Notice(langSmithCheckMessage);
		return;
	}

	pluginData.langSmithEndpoint = langSmithEndpointDraft.trim() || DEFAULT_LANGSMITH_ENDPOINT;
	const endpoint = normalizeLangSmithEndpoint(langSmithEndpointDraft);

	let validationUrl: string;
	try {
		validationUrl = new URL("/api/v1/sessions?limit=1", `${endpoint}/`).toString();
	} catch {
		langSmithCheckState = "error";
		langSmithCheckMessage = "Geçersiz LangSmith uç nokta URL'si";
		new Notice(langSmithCheckMessage);
		return;
	}

	langSmithCheckState = "pending";
	langSmithCheckMessage = "LangSmith bağlantısı kontrol ediliyor...";

	try {
		const obsidianFetch = createObsidianFetch(window.fetch.bind(window));
		const response = await obsidianFetch(validationUrl, {
			method: "GET",
			headers: {
				"x-api-key": apiKey,
				accept: "application/json",
			},
		});

		if (response.ok) {
			langSmithCheckState = "success";
			langSmithCheckMessage = "LangSmith bağlantısı başarılı";
			new Notice(langSmithCheckMessage);
			return;
		}

		const responseText = (await response.text()).trim();
		if (response.status === 401 || response.status === 403) {
			langSmithCheckState = "error";
			langSmithCheckMessage = "LangSmith API anahtarını reddetti";
		} else if (response.status === 404) {
			langSmithCheckState = "error";
			langSmithCheckMessage = "LangSmith uç noktası beklenen API'yi sunmadı";
		} else {
			langSmithCheckState = "error";
			langSmithCheckMessage = responseText
				? `LangSmith kontrolü başarısız (${response.status}): ${responseText}`
				: `LangSmith kontrolü ${response.status} durumuyla başarısız oldu`;
		}
		new Notice(langSmithCheckMessage);
	} catch (error) {
		langSmithCheckState = "error";
		langSmithCheckMessage = error instanceof Error ? error.message : "LangSmith'e ulaşılamadı";
		new Notice(`LangSmith kontrolü başarısız: ${langSmithCheckMessage}`);
	}
}
</script>

<!-- Onboarding -->
<SettingGroup heading="Karşılama">
  <SettingItem
    name="Karşılama tanıtımını yeniden oynat"
    desc="Açılış animasyonunu ve tamamlanma bayraklarını sıfırlar — Karşılama görünümü tanıtımını yeniden oynatır ve bir sağlayıcı yapılandırılana kadar ilk çalıştırmaymış gibi başlangıçta otomatik açılır."
  >
    <Button buttonText="Tanıtımı sıfırla" iconId="rotate-ccw" onClick={replayOnboardingIntro} />
  </SettingItem>
</SettingGroup>

<!-- Chat -->
<SettingGroup heading="Sohbet">
  <SettingItem
    name="Ham araç girdisini/çıktısını göster"
    desc="Sohbet araç çağrısı satırlarında tam araç argümanlarını ve ham çıktı bloğunu göster. Varsayılan olarak kapalı — kullanıcılar yalnızca sade dille özeti ve dostane yapılandırılmış sonucu görür."
  >
    <Toggle
      checked={pluginData.showToolIODetails}
      onchange={(checked) => (pluginData.showToolIODetails = checked)}
    />
  </SettingItem>

  <SettingItem
    name="Kapatılmış önerileri geri getir"
    desc="Yeni bir sohbetin boş durumundan kapatılan tüm önerilen sorguları, eklenti beceri ipuçlarını ve güncellenmiş varsayılan bildirimlerini geri getir."
  >
    <Button
      buttonText="Geri getir"
      iconId="rotate-ccw"
      onClick={restoreDismissedRecommendations}
    />
  </SettingItem>

  <SettingItem
    name="Entegrasyon gizlilik uyarısını geri getir"
    desc="Bir eklenti entegrasyonunun kod çalıştırma aracını etkinleştirmeden önce gösterilen uyarıdaki 'Bir daha sorma' seçimini geri alır (bu araç sağlayıcı bazlı gizlilik kurallarını atlar)."
  >
    <Button
      buttonText="Geri getir"
      iconId="rotate-ccw"
      onClick={restoreIntegrationPrivacyWarning}
    />
  </SettingItem>
</SettingGroup>

<!-- Observability -->
<SettingGroup heading="Gözlemlenebilirlik">
  <SettingItem
    name="LangSmith entegrasyonu"
    desc="Hata ayıklama ve izleme için LangSmith telemetrisini etkinleştir"
  >
    <Toggle
      checked={pluginData.enableLangSmith}
      onchange={(checked) => (pluginData.enableLangSmith = checked)}
    />
  </SettingItem>

  {#if pluginData.enableLangSmith}
    <SettingItem
      name="API anahtarı"
      desc="LangSmith kimlik doğrulaması için bir Obsidian anahtarlık gizli değeri seçin"
    >
      <SecretSelect
        value={pluginData.langSmithApiKeyId}
        suggestedId={suggestSecretId(plugin.app, "LangSmith", "apiKey")}
        onChange={(secretId) => (pluginData.langSmithApiKeyId = secretId)}
      />
    </SettingItem>

    <SettingItem name="Proje adı" desc="Çalıştırmaları ilişkilendirmek için proje adı">
      <Text
        placeholder="obsidian-agent"
        inputType="text"
        value={pluginData.langSmithProject}
        onblur={(v) => (pluginData.langSmithProject = v)}
      />
    </SettingItem>

    <SettingItem name="Uç nokta URL'si" desc="LangSmith API temel URL'sini geçersiz kıl (isteğe bağlı)">
      <div class="flex items-center gap-2 w-full">
        <Button
          iconId={getLangSmithCheckIcon()}
          ariaLabel="LangSmith API anahtarını ve uç noktasını kontrol et"
          tooltip={langSmithCheckMessage}
          styles={getLangSmithCheckButtonStyles()}
          disabled={langSmithCheckState === "pending"}
          onClick={() => void handleCheckLangSmithConnection()}
        />
        <Text
          placeholder={DEFAULT_LANGSMITH_ENDPOINT}
          inputType="text"
          bind:value={langSmithEndpointDraft}
          class="flex-1"
          onblur={(v) => (pluginData.langSmithEndpoint = v)}
        />
      </div>
    </SettingItem>
  {/if}
</SettingGroup>

<style>
  :global(.langsmith-check-button) {
    color: var(--text-muted);
  }

  :global(.langsmith-check-button.is-success) {
    color: var(--text-success, #4caf50);
  }

  :global(.langsmith-check-button.is-error) {
    color: var(--text-error);
  }

  :global(.langsmith-check-button.is-pending .s2b-button-icon) {
    animation: langsmith-check-spin 1s linear infinite;
  }

  @keyframes langsmith-check-spin {
    from {
      transform: rotate(0deg);
    }

    to {
      transform: rotate(360deg);
    }
  }
</style>
