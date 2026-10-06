<script lang="ts">
import {
	MAX_EMBEDDING_BATCH_SIZE,
	MIN_EMBEDDING_BATCH_SIZE,
	getDefaultEmbeddingBatchSize,
	normalizeEmbeddingBatchSize,
} from "../../vectorstore/batchSize";
import { useAvailableModels } from "../../hooks/useAvailableModels.svelte";
import { getProviderDefinition } from "../../providers";
import ModelSettingControl from "../settings/ModelSettingControl.svelte";
import SettingContainer from "../settings/SettingContainer.svelte";
import Button from "../ui/Button.svelte";
import Text from "../ui/Text.svelte";
import GenericAIIcon from "../ui/logos/GenericAIIcon.svelte";
import type SecondBrainPlugin from "../../main";
import { ModelSelectionModal, type SelectedModel } from "./ModelSelectionModal";
import type { EmbeddingIndexSetupModal } from "./EmbeddingIndexSetupModal";

interface Props {
	modal: EmbeddingIndexSetupModal;
	plugin: SecondBrainPlugin;
	currentSelection: SelectedModel | null;
	onSave: (selectedModel: SelectedModel, batchSize: number) => void;
	/** Resolves true when an index was imported, false when cancelled or rejected.
	 * Omitted when importing isn't available (desktop-only), which hides the row. */
	onImport?: () => Promise<boolean>;
}

const { modal, plugin, currentSelection, onSave, onImport }: Props = $props();
const availableModels = useAvailableModels();
let selectedModel = $state<SelectedModel | null>(null);
let isImporting = $state(false);

$effect(() => {
	if (!selectedModel && currentSelection) {
		selectedModel = currentSelection;
	}
});

const suggestedBatchSize = $derived.by(() => {
	if (!selectedModel) {
		return MIN_EMBEDDING_BATCH_SIZE;
	}

	const existingIndex = plugin.pluginData.getEmbeddingIndex(`${selectedModel.provider}:${selectedModel.model}`);
	return existingIndex?.batchSize ?? getDefaultEmbeddingBatchSize(selectedModel.provider);
});

let batchSize = $state(0);
let error = $state("");
let lastModelKey = $state<string | null>(null);

$effect(() => {
	if (!selectedModel) {
		return;
	}

	const nextModelKey = `${selectedModel.provider}:${selectedModel.model}`;
	if (nextModelKey !== lastModelKey) {
		batchSize = suggestedBatchSize;
		lastModelKey = nextModelKey;
		error = "";
	}
});

const selectedModelLabel = $derived.by(() => {
	if (!selectedModel) {
		return null;
	}

	return selectedModel.model;
});

const selectedModelLogo = $derived.by(() => {
	if (!selectedModel) {
		return null;
	}

	const providerDefinition = getProviderDefinition(selectedModel.provider, plugin.pluginData.getAllProviderMeta());
	return providerDefinition && "logo" in providerDefinition && providerDefinition.logo
		? providerDefinition.logo
		: GenericAIIcon;
});

function openModelSelection() {
	new ModelSelectionModal(plugin, "embedding", selectedModel, (model) => {
		if (!model) {
			return;
		}

		selectedModel = model;
		error = "";
	}).open();
}

function handleSave() {
	if (!selectedModel) {
		error = "Bir gömme modeli seçin.";
		return;
	}

	if (!Number.isFinite(batchSize)) {
		error = "Toplu iş boyutu bir sayı olmalıdır.";
		return;
	}

	if (batchSize < MIN_EMBEDDING_BATCH_SIZE || batchSize > MAX_EMBEDDING_BATCH_SIZE) {
		error = `Batch size must be between ${MIN_EMBEDDING_BATCH_SIZE} and ${MAX_EMBEDDING_BATCH_SIZE}.`;
		return;
	}

	error = "";
	onSave(selectedModel, normalizeEmbeddingBatchSize(batchSize, selectedModel.provider));
	modal.close();
}

// A successful import selects the imported index outright, so there is nothing
// left to configure here and the modal closes. Cancelling the file dialog (or
// picking a file that gets rejected — that reports itself through a notice) must
// leave the modal open, so the user can still build an index instead.
async function handleImport() {
	if (!onImport || isImporting) {
		return;
	}

	isImporting = true;
	try {
		if (await onImport()) {
			modal.close();
		}
	} catch (importError) {
		error = importError instanceof Error ? importError.message : String(importError);
	} finally {
		isImporting = false;
	}
}
</script>

<div class="embedding-index-setup-modal">
  <div class="modal-intro">Bir model seçin, ardından gerekirse toplu iş boyutunu ayarlayın.</div>

  <div class="settings-panel">
    <SettingContainer name="Gömme modeli" desc="Bu dizini oluşturmak ve yenilemek için kullanılır.">
      <ModelSettingControl
        available={availableModels.hasProviders && availableModels.hasEmbedModels}
        loading={availableModels.hasProviders && availableModels.isLoadingModels}
        configureLabel={!availableModels.hasProviders ? "Configure Provider" : "Configure Models"}
        unavailableHint={!availableModels.hasProviders
          ? "Henüz yapılandırılmış bir yapay zekâ sağlayıcısı yok."
          : "Sağlayıcılarınız için gömme modeli bulunamadı."}
        onConfigure={() => availableModels.openSettings(() => modal.close(), { needsEmbedding: true })}
        placeholder="Bir model seçin"
        selectedLabel={selectedModelLabel}
        selectedLogo={selectedModelLogo}
        onSelect={openModelSelection}
      />
    </SettingContainer>

    <SettingContainer
      name="Toplu iş boyutu"
      desc={`Gömme isteği başına not sayısı. Düşük değerler yerel modeller için daha güvenli; yüksek değerler barındırılan sağlayıcılar için daha iyidir. Aralık: ${MIN_EMBEDDING_BATCH_SIZE}-${MAX_EMBEDDING_BATCH_SIZE}.`}
    >
      <Text
        inputType="number"
        value={batchSize}
        placeholder={suggestedBatchSize.toString()}
        onchange={(value) => {
          batchSize = value;
          error = "";
        }}
      />
    </SettingContainer>

    {#if onImport}
      <SettingContainer
        name="Mevcut dizini içe aktar"
        desc="Yeni bir dizin oluşturmak yerine başka bir kasadan aktarılan dizini yükleyin. Yeniden oluşturma yalnızca aktarım güncel değilse gerekir."
      >
        <Button
          iconId="upload"
          buttonText={isImporting ? "Importing…" : "Import"}
          disabled={isImporting}
          onClick={() => void handleImport()}
        />
      </SettingContainer>
    {/if}

    {#if error}
      <div class="setting-item">
        <div class="text-[--text-error] text-sm">{error}</div>
      </div>
    {/if}
  </div>
</div>

<div class="modal-button-container">
  <Button buttonText="İptal" onClick={() => modal.close()} />
  <Button buttonText="Dizinlemeyi başlat" cta={true} onClick={handleSave} disabled={!selectedModel} />
</div>

<style>
  .embedding-index-setup-modal {
    display: flex;
    flex-direction: column;
    gap: 12px;
    height: 100%;
    min-height: 0;
  }

  .modal-intro {
    color: var(--text-muted);
    font-size: 0.95rem;
    line-height: 1.4;
  }

  .settings-panel {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
</style>
