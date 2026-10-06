<script lang="ts">
import { SearchDisplaySettingsModal } from "../../components/modal/SearchDisplaySettingsModal";
import EmbeddingIndexSection from "../../components/settings/EmbeddingIndexSection.svelte";
import SettingGroup from "../../components/settings/SettingGroup.svelte";
import SettingItem from "../../components/settings/SettingItem.svelte";
import Button from "../../components/ui/Button.svelte";
import Toggle from "../../components/ui/Toggle.svelte";
import { getData } from "../../stores/dataStore.svelte";
import { getPlugin } from "../../stores/state.svelte";
import { isMobileUI } from "../../utils/platform";

const pluginData = getData();
const plugin = getPlugin();

const displaySummary = $derived.by(() => {
	const enabledLabels: string[] = [];
	if (pluginData.searchShowPath) enabledLabels.push("Yol");
	if (pluginData.searchShowTags) enabledLabels.push("Etiketler");
	if (pluginData.searchShowMatchBadges) enabledLabels.push("Eşleşme rozetleri");
	if (pluginData.searchShowMatchContext) enabledLabels.push("İçerik alıntıları");

	return enabledLabels.length > 0 ? enabledLabels.join(", ") : "Ek bilgi yok";
});

function openDisplaySettingsModal() {
	new SearchDisplaySettingsModal(plugin.app).open();
}
</script>

<SettingGroup heading="Görünüm">
  <SettingItem
    name="Sonuç ayrıntıları"
    desc={`Her arama sonucunda hangi üst verilerin ve bağlamın görüneceğini seçin. Şu an: ${displaySummary}.`}
  >
    <Button buttonText="Yapılandır" onClick={openDisplaySettingsModal} />
  </SettingItem>

  {#if isMobileUI()}
    <SettingItem
      name="Üst çubukta S2B aramasını kullan"
      desc="Alt üst çubuktaki büyüteç düğmesinin Obsidian'ın hızlı geçişi yerine Akıllı İkinci Beyin aramasını açmasını sağlar. Yalnızca o düğme değişir — hızlı geçiş hâlâ komut paletinden ve kendi kısayolundan açılır."
    >
      <Toggle
        checked={pluginData.overrideMobileNavbarSearch}
        onchange={(checked) => (pluginData.overrideMobileNavbarSearch = checked)}
      />
    </SettingItem>
  {/if}
</SettingGroup>

<EmbeddingIndexSection purpose="search" />
