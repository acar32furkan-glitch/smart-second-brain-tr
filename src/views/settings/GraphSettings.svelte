<script lang="ts">
import EmbeddingIndexSection from "../../components/settings/EmbeddingIndexSection.svelte";
import ModelSettingControl from "../../components/settings/ModelSettingControl.svelte";
import SettingGroup from "../../components/settings/SettingGroup.svelte";
import SettingItem from "../../components/settings/SettingItem.svelte";
import RangeSlider from "../../components/ui/RangeSlider.svelte";
import Toggle from "../../components/ui/Toggle.svelte";
import { ModelSelectionModal } from "../../components/modal/ModelSelectionModal";
import { useAvailableModels } from "../../hooks/useAvailableModels.svelte";
import { getData } from "../../stores/dataStore.svelte";
import { getPlugin } from "../../stores/state.svelte";

const pluginData = getData();
const plugin = getPlugin();
const models = useAvailableModels();

// Helper to update a single graph setting field
function updateSetting<K extends keyof typeof pluginData.smartGraphSettings>(
	key: K,
	value: (typeof pluginData.smartGraphSettings)[K],
) {
	pluginData.smartGraphSettings = { ...pluginData.smartGraphSettings, [key]: value };
}

const graphChatModel = $derived(pluginData.smartGraphSettings.graphChatModel ?? null);

/**
 * Whether the configured naming model would have private titles withheld.
 *
 * Note titles are the entire payload for topic naming, so a private note is
 * withheld outright rather than partially redacted.
 */
const graphModelWithholdsPrivate = $derived(
	graphChatModel != null && !pluginData.isProviderTrusted(graphChatModel.provider),
);

/**
 * The naming-model description, which gains a warning only while it is actually
 * true — invisible for a trusted or local provider.
 *
 * Sits on the model row rather than the automatic toggle because withholding is
 * a property of the selected provider: it applies to manual naming too. Stated
 * here at all because the automatic pass deliberately runs silent (it fires on
 * every topic change, and a notice there would nag), so for a user who never
 * presses the button in the Topics panel this is the only place it surfaces.
 */
const namingModelDesc = $derived(
	graphModelWithholdsPrivate
		? "Konuları adlandırmak için kullanılan model. Model yoksa bir konu, en iyi bağlanan notuna göre adlandırılır. " +
				"Bu sağlayıcı gizli notlar için güvenilir değil, bu yüzden gizli başlıklar adlandırmadan çıkarılır."
		: "Konuları adlandırmak için kullanılan model. Model yoksa bir konu, en iyi bağlanan notuna göre adlandırılır.",
);

function openGraphModelSelection() {
	new ModelSelectionModal(
		plugin,
		"chat",
		graphChatModel ? { provider: graphChatModel.provider, model: graphChatModel.model } : null,
		(selected) => {
			updateSetting("graphChatModel", selected ? { ...selected, modelConfig: {} } : null);
		},
	).open();
}
</script>

<SettingGroup heading="Konu adları">
  <SettingItem name="Konu adlandırma modeli" desc={namingModelDesc}>
    <ModelSettingControl
      available={models.hasProviders && models.hasModels}
      loading={models.hasProviders && models.isLoadingModels}
      configureLabel={!models.hasProviders ? "Sağlayıcı Yapılandır" : "Modelleri Yapılandır"}
      unavailableHint={!models.hasProviders ? "Henüz yapılandırılmış bir yapay zekâ sağlayıcısı yok." : undefined}
      onConfigure={() => models.openSettings()}
      placeholder="Bir model seçin"
      selectedLabel={graphChatModel?.model ?? null}
      onSelect={openGraphModelSelection}
      secondaryLabel={graphChatModel ? "Temizle" : undefined}
      onSecondary={graphChatModel ? () => updateSetting("graphChatModel", null) : undefined}
    />
  </SettingItem>
  <SettingItem
    name="Konuları otomatik adlandır"
    desc="Konular değiştiğinde adlandır. Kapalıyken adlandırma yalnızca grafiğin Konular panelinden çalışır."
  >
    <Toggle
      checked={pluginData.smartGraphSettings.autoLabelClusters ?? false}
      onchange={(value) => updateSetting("autoLabelClusters", value)}
    />
  </SettingItem>
</SettingGroup>

<!-- Selecting a graph index turns on semantic edges: notes with no wiki links are
     connected to their nearest topic, so topic detection can place them. Without
     one the graph falls back to wiki links only. -->
<EmbeddingIndexSection purpose="graph" />
