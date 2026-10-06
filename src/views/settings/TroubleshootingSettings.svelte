<script lang="ts">
import { Notice } from "obsidian";
import { get } from "svelte/store";
import { t } from "svelte-i18n";
import SettingGroup from "../../components/settings/SettingGroup.svelte";
import SettingItem from "../../components/settings/SettingItem.svelte";
import Button from "../../components/ui/Button.svelte";
import Toggle from "../../components/ui/Toggle.svelte";
import { getData } from "../../stores/dataStore.svelte";
import { getPlugin } from "../../stores/state.svelte";
import { ConfirmModal } from "../../components/modal/ConfirmModal";
import DocsLink from "../../components/ui/DocsLink.svelte";
import ExternalLinkButton from "../../components/ui/ExternalLinkButton.svelte";
import { Logger } from "../../utils/logging";

const pluginData = getData();
const plugin = getPlugin();
const githubIssuesListUrl =
	"https://github.com/s2b-dev/smart-second-brain/issues?q=is%3Aissue%20state%3Aopen%20label%3Abug";
const githubIssuesNewUrl = "https://github.com/s2b-dev/smart-second-brain/issues/new/choose";

async function handleCleanupPluginData() {
	const modal = new ConfirmModal(
		plugin.app,
		get(t)("settings.clear_modal.title"),
		get(t)("settings.clear_modal.description"),
		"Sil",
	);
	modal.open();
	if (!(await modal.promise).confirmed) return;

	try {
		// Each index is deleted independently, and a failure does not abort the cleanup:
		// `deleteIndex` rejects when its IndexedDB databases can't be dropped (e.g. a
		// connection still holds one), and letting that propagate would skip `deleteData()`
		// entirely — so "clear plugin data" would leave the plugin data behind too.
		const failed: string[] = [];
		for (const index of [...pluginData.embeddingIndexes]) {
			try {
				await plugin.vectorStoreService.deleteIndex(index.id);
			} catch (error) {
				failed.push(index.id);
				Logger.error(`[Troubleshooting] Failed to delete embedding index ${index.id}:`, error);
			}
		}

		await pluginData.deleteData();
		if (failed.length > 0) {
			new Notice(
				`Eklenti verileri temizlendi, ancak ${failed.join(", ")} için saklanan vektörler silinemedi. Ayrıntılar için konsola bakın.`,
			);
		} else {
			new Notice(get(t)("plugin_data_cleared"));
		}
	} catch (error) {
		new Notice(error instanceof Error ? error.message : "Eklenti verileri temizlenemedi");
	}
}
</script>

<!-- Diagnostics -->
<SettingGroup heading="Tanılama">
  <SettingItem name={$t("settings.verbose")} desc={$t("settings.verbose_desc")}>
    <Toggle
      checked={pluginData.isVerbose}
      onchange={(checked) => (pluginData.isVerbose = checked)}
    />
  </SettingItem>
</SettingGroup>

<!-- Maintenance -->
<SettingGroup heading="Bakım">
  <SettingItem
    name="Sürüm notları"
    desc={`${plugin.manifest.version} sürümündesiniz. Son sürümlerde nelerin değiştiğini görün.`}
  >
    <Button buttonText="Sürüm notlarını göster" onClick={() => void plugin.showReleaseNotes()} />
  </SettingItem>

  <!-- Docs first, GitHub as the escalation path: the troubleshooting guide is
       organised by symptom (the agent won't respond, search returns nothing, a note
       is being withheld, …), so it answers most of what would otherwise arrive as
       an issue. -->
  <SettingItem
    name="Sorun giderme kılavuzu"
    desc="Sık karşılaşılan sorunlar ve çözümleri — ajanın yanıt vermemesi, işe yaramayan arama sonuçları, gizlenen notlar, eksik MCP araçları ve mobile özgü sorunlar."
  >
    <DocsLink variant="button" doc="troubleshooting" label="Kılavuzu aç" />
  </SettingItem>

  <SettingItem
    name="Hâlâ takıldınız mı?"
    desc="Sorunun zaten kayıtlı olup olmadığını görmek için mevcut GitHub konularına göz atın. Kayıtlı değilse yeni bir konu açın; ne denediğinizi, hata mesajlarını ve sorunu yeniden oluşturma adımlarını ekleyin."
  >
    <div class="flex gap-2 flex-wrap">
      <ExternalLinkButton href={githubIssuesListUrl} label="Mevcut konuları görüntüle" />
      <ExternalLinkButton href={githubIssuesNewUrl} label="Yeni konu aç" />
    </div>
  </SettingItem>

  <SettingItem name={$t("settings.clear")} desc={$t("settings.clear_desc")}>
    <Button
      buttonText={$t("settings.clear_label")}
      styles="mod-warning"
      onClick={() => void handleCleanupPluginData()}
    />
  </SettingItem>
</SettingGroup>
