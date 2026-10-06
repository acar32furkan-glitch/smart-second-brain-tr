<script lang="ts">
import { normalizePath } from "obsidian";
import type SecondBrainPlugin from "../../main";
import {
	slugifySkillName,
	humanizeSkillName,
	validateSkillName,
	validateDescription,
	parseFrontmatter,
} from "../../skills";
import { Tabs } from "bits-ui";
import { createObsidianFetch } from "../../lib/obsidianFetch";
import SettingContainer from "../settings/SettingContainer.svelte";
import Button from "../ui/Button.svelte";
import DocsLink from "../ui/DocsLink.svelte";
import ExternalLinkButton from "../ui/ExternalLinkButton.svelte";
import SlidingTabs, { type SlidingTab } from "../ui/SlidingTabs.svelte";
import Text from "../ui/Text.svelte";
import type { AddSkillModal } from "./AddSkillModal";

interface Props {
	modal: AddSkillModal;
	plugin: SecondBrainPlugin;
	agentId: string;
	onSave: (skillId: string) => void | Promise<void>;
}

const { modal, plugin, agentId, onSave }: Props = $props();

// Mode: "create" or "import"
type Mode = "create" | "import";
let mode = $state<Mode>("create");

const SKILL_MODE_TABS: SlidingTab<Mode>[] = [
	{ id: "create", label: "Yeni oluştur", icon: "plus" },
	{ id: "import", label: "URL'den içe aktar", icon: "download" },
];

let skillName = $state("");
let skillDescription = $state("");
// Body for the new SKILL.md. Empty in the create flow (we scaffold a starter), or the
// fetched body when importing. The user writes/edits the real instructions in the opened note.
let importedBody = $state("");
let validationError = $state("");

// Import mode state
let importUrl = $state("");
let importLoading = $state(false);
let importError = $state("");

// Generate slug from display name
const skillSlug = $derived(slugifySkillName(skillName));

// Validate per Agent Skills spec
const validation = $derived(() => {
	if (!skillName.trim()) return { valid: false, error: "Ad gerekli" };

	const nameResult = validateSkillName(skillSlug);
	if (!nameResult.valid) {
		return { valid: false, error: nameResult.errors[0]?.message || "Geçersiz ad" };
	}

	const descResult = validateDescription(skillDescription);
	if (!descResult.valid) {
		return { valid: false, error: descResult.errors[0]?.message || "Açıklama gerekli" };
	}

	return { valid: true, error: "" };
});

const isValid = $derived(validation().valid);

/**
 * Convert a GitHub URL to raw content URL.
 * Supports: github.com blob URLs, raw.githubusercontent.com
 */
function toRawGitHubUrl(url: string): string {
	// Already a raw URL
	if (url.includes("raw.githubusercontent.com")) {
		return url;
	}
	// Convert github.com/owner/repo/blob/branch/path to raw URL
	const blobMatch = url.match(/github\.com\/([^\/]+)\/([^\/]+)\/blob\/([^\/]+)\/(.+)/);
	if (blobMatch) {
		const [, owner, repo, branch, path] = blobMatch;
		return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`;
	}
	return url;
}

async function handleImport() {
	if (!importUrl.trim()) {
		importError = "Lütfen bir URL girin";
		return;
	}

	importLoading = true;
	importError = "";

	try {
		const rawUrl = toRawGitHubUrl(importUrl.trim());
		const obsidianFetch = createObsidianFetch(fetch);
		const response = await obsidianFetch(rawUrl);

		if (!response.ok) {
			throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
		}

		const content = await response.text();

		// Parse the SKILL.md content
		const { frontmatter, body } = parseFrontmatter(content);

		if (!frontmatter.name || !frontmatter.description) {
			throw new Error("Invalid SKILL.md: missing name or description in frontmatter");
		}

		// Populate fields; keep the imported body so it's written into the new note verbatim.
		skillName = humanizeSkillName(frontmatter.name);
		skillDescription = frontmatter.description;
		importedBody = body;

		// Switch to create view so the user can confirm name/description before we scaffold + open.
		mode = "create";
		importUrl = "";
	} catch (err) {
		importError = err instanceof Error ? err.message : "Beceri içe aktarılamadı";
	} finally {
		importLoading = false;
	}
}

const SKILLS_MARKETPLACE_URL = "https://skillsmp.com/";

/** Starter body written into a brand-new skill (when not importing an existing one). */
function scaffoldBody(): string {
	return `# ${skillName.trim()}\n\nDescribe when to use this skill and the steps to follow.\n`;
}

async function handleSave() {
	if (!isValid) {
		validationError = validation().error;
		return;
	}

	// Write a SKILL.md (scaffold for a new skill, or the imported body) then open the note so
	// the user writes the real instructions in Obsidian — consistent with the edit (pencil) flow.
	const skillsService = plugin.skillsService;
	const result = await skillsService.saveSkill({
		frontmatter: {
			name: skillSlug,
			description: skillDescription.trim(),
		},
		content: importedBody.trim() ? importedBody : scaffoldBody(),
	});

	if (!result.valid) {
		validationError = result.errors[0]?.message || "Beceri kaydedilemedi";
		return;
	}

	// Re-discover skills to update cache, then let the agent reinitialize.
	await skillsService.discoverSkills();
	await onSave(skillSlug);

	// Open the freshly created note for editing, then close the modal.
	const metadata = skillsService.getCachedSkills().get(skillSlug);
	if (metadata) {
		const skillPath = normalizePath(`${metadata.path}/SKILL.md`);
		modal.close();
		plugin.app.workspace.openLinkText(skillPath, "", true);
	} else {
		modal.close();
	}
}
</script>

<div class="add-skill-modal-content">
  <SlidingTabs bind:value={mode} tabs={SKILL_MODE_TABS}>
    <Tabs.Content value="create">
      <SettingContainer
        name="Ad"
        desc={skillSlug && skillSlug !== skillName.toLowerCase()
          ? `Şu şekilde kaydedildi: ${skillSlug}`
          : "Becerinin görünen adı."}
      >
        <Text
          id="add-skill-name"
          inputType="text"
          value={skillName}
          placeholder="örn. Kod İncelemesi, Yazım Tarzı"
          onchange={(val) => (skillName = val)}
        />
      </SettingContainer>

      <SettingContainer
        name="Açıklama"
        desc="Bu becerinin ne yaptığı ve ne zaman kullanılacağı. Ekledikten sonra, tam talimatları yazabilmeniz için becerinin notu açılır."
      >
        <Text
          id="add-skill-description"
          inputType="text"
          value={skillDescription}
          placeholder="Bu becerinin ne zaman kullanılacağını açıklayın..."
          onchange={(val) => (skillDescription = val)}
        />
      </SettingContainer>

      {#if validationError}
        <div class="add-skill-error">{validationError}</div>
      {/if}
    </Tabs.Content>

    <Tabs.Content value="import">
      <SettingContainer
        name="SKILL.md URL"
        desc="Bir SKILL.md dosyasına GitHub URL'si yapıştırın. github.com ve raw.githubusercontent.com URL'lerini destekler."
      >
        <Text
          id="add-skill-import-url"
          inputType="text"
          value={importUrl}
          placeholder="https://github.com/owner/repo/blob/main/skills/my-skill/SKILL.md"
          onchange={(val) => (importUrl = val)}
        />
      </SettingContainer>

      <!-- SkillsMP is where skills are found; the docs explain the SKILL.md format an
           imported one has to satisfy, so both belong on this row. -->
      <SettingContainer name="Becerilere göz at" desc="skillsmp.com üzerinde topluluk becerilerini bulun.">
        {#snippet nameSuffix()}
          <DocsLink doc="skills" subject="Skills" />
        {/snippet}
        <ExternalLinkButton href={SKILLS_MARKETPLACE_URL} label="Open SkillsMP" />
      </SettingContainer>

      {#if importError}
        <div class="add-skill-error">{importError}</div>
      {/if}
    </Tabs.Content>
  </SlidingTabs>

  <!-- Obsidian's own footer class, so the buttons sit where they do in every
       core modal instead of in a hand-rolled row. -->
  <div class="modal-button-container">
    <Button buttonText="İptal" onClick={() => modal.close()} />
    {#if mode === "import"}
      <Button
        buttonText={importLoading ? "Importing..." : "Import"}
        cta={true}
        onClick={handleImport}
        disabled={importLoading || !importUrl.trim()}
      />
    {:else}
      <Button buttonText="Ekle ve notu aç" cta={true} onClick={handleSave} disabled={!isValid} />
    {/if}
  </div>
</div>

<style>
  .add-skill-modal-content {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .add-skill-error {
    color: var(--text-error);
    font-size: var(--font-ui-small);
    padding: 8px 12px;
    background: var(--background-modifier-error);
    border-radius: 6px;
  }

  /* The tab strip owns the spacing above; without this the first SettingContainer's
     own top border sits directly under it with no breathing room. */
  .add-skill-modal-content :global([data-tabs-content]) {
    padding-top: 4px;
  }
</style>
