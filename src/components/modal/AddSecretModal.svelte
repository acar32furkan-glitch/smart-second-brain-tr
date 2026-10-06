<script lang="ts">
import { untrack } from "svelte";
import { getPlugin } from "../../stores/state.svelte";
import { isValidSecretId, setSecret } from "../../lib/secretStorage";
import SettingContainer from "../settings/SettingContainer.svelte";
import Button from "../ui/Button.svelte";
import Text from "../ui/Text.svelte";
import type { AddSecretModal } from "./AddSecretModal";

interface Props {
	modal: AddSecretModal;
	onSecretAdded: (secretId: string) => void;
	/** Pre-filled ID derived from the opening context (provider, tool, ...). Still editable. */
	suggestedId?: string;
}

const { modal, onSecretAdded, suggestedId }: Props = $props();

const plugin = getPlugin();

// Seeded once, then owned by the input: the suggestion is a starting point the
// user is free to edit, not a value to stay in sync with.
let secretId = $state(untrack(() => suggestedId) ?? "");
let secretValue = $state("");
let error = $state("");

// Validate the secret ID in real-time
let isValidId = $derived(secretId.length > 0 && isValidSecretId(secretId));

function handleSave() {
	error = "";

	if (!secretId.trim()) {
		error = "Gizli değer adı gerekli";
		return;
	}

	if (!isValidSecretId(secretId)) {
		error = "Geçersiz ad. Yalnızca küçük harf, rakam ve tire kullanın (en fazla 64 karakter)";
		return;
	}

	if (!secretValue.trim()) {
		error = "Gizli değer gerekli";
		return;
	}

	try {
		setSecret(plugin.app, secretId, secretValue);
		onSecretAdded(secretId);
		modal.close();
	} catch (e) {
		error = `Gizli değer kaydedilemedi: ${e}`;
	}
}
</script>

<div class="modal-content">
	<!-- Description -->
	<div class="setting-item-description mb-4">
		<p>
			Gizli değerler, eklenti verilerinden ayrı olarak Obsidian'ın Anahtarlığında güvenle saklanır.
			Bu sayede API anahtarlarını düz metin olarak saklamadan birden çok eklenti arasında
			paylaşabilirsiniz.
		</p>
	</div>

	<SettingContainer
		name="Gizli değer adı"
		desc={suggestedId
			? "Bunu açtığınız yerden önerildi. Sağlayıcılar arasında bir adı yeniden kullanmak için düzenleyin."
			: "Bu gizli değer için benzersiz ad (küçük harf, rakam, tire)"}
	>
		<Text
			inputType="text"
			placeholder="my-api-key"
			bind:value={secretId}
			styles={secretId.length > 0 && !isValidId ? "!border-[--background-modifier-error]" : ""}
		/>
	</SettingContainer>

	<SettingContainer name="Gizli değer" desc="Güvenle saklanacak API anahtarı veya gizli değer">
		<Text inputType="password" placeholder="sk-..." bind:value={secretValue} />
	</SettingContainer>

	{#if error}
		<div class="setting-item">
			<div class="text-[--text-error] text-sm">{error}</div>
		</div>
	{/if}
</div>

<div class="modal-button-container">
	<Button buttonText="İptal" onClick={() => modal.close()} />
	<Button buttonText="Gizli değeri kaydet" cta={true} disabled={!isValidId || !secretValue} onClick={handleSave} />
</div>
