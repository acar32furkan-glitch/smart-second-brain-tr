<script lang="ts">
import Button from "../ui/Button.svelte";
import type { PrivacyWarningModal } from "./PrivacyWarningModal";

interface Props {
	modal: PrivacyWarningModal;
	onConfirm: () => void;
	onCancel: () => void;
}

let { modal, onConfirm, onCancel }: Props = $props();
</script>

<div class="modal-title">Gizlilik Uyarısı</div>
<div class="modal-content">
  <p>
    Your chat history contains references to <strong>private notes</strong>. The provider you are
    switching to is <strong>not trusted with private notes</strong>.
  </p>
  <p>Devam etmek, gizli not içeriğini bu sağlayıcıya açığa çıkarabilir.</p>
</div>

<div class="modal-button-container">
  <Button buttonText="İptal" onClick={onCancel} />
  <Button buttonText="Yine de devam et" styles="mod-warning" onClick={onConfirm} />
</div>
