// Plan: ideas → projects with the steps a creator usually goes through.
// Each template lists its steps in order; the "to" link opens the place in the app
// where that step gets done.

export const IDEA_STATUSES = [
  { id: 'inbox', label: 'Inbox' },
  { id: 'shortlist', label: 'Shortlist' },
  { id: 'project', label: 'In a project' },
  { id: 'archived', label: 'Archived' },
]

// Board columns: Ideas (ideas not yet in a project) + three project states.
export const PROJECT_STATUSES = [
  { id: 'todo', label: 'To do' },
  { id: 'doing', label: 'Doing' },
  { id: 'done', label: 'Done' },
]
// Projects saved before the board had 3 states.
export function normalizeStatus(s) {
  if (s === 'done') return 'done'
  if (s === 'doing' || s === 'producing' || s === 'review' || s === 'scheduled') return 'doing'
  return 'todo'
}

export const PROJECT_TEMPLATES = [
  {
    id: 'content-piece', name: 'Content piece', blurb: 'One Reel, TikTok or carousel from idea to posted.',
    steps: [
      { label: 'Pick the idea and the goal (reach, saves, sales)' },
      { label: 'Write the hook and script', assist: 'hooks' },
      { label: 'Shot list: poses, outfits, locations' },
      { label: 'Generate photos', to: '/influencers' },
      { label: 'Generate or edit the video', to: '/influencers' },
      { label: 'Caption, hashtags and on-screen text', assist: 'caption' },
      { label: 'Review and approve' },
      { label: 'Schedule or post', to: '/content' },
      { label: 'Check results after 48 hours' },
    ],
  },
  {
    id: 'content-series', name: 'Content series', blurb: 'A recurring format, e.g. 5 episodes of the same hook.',
    steps: [
      { label: 'Define the format and the repeatable hook' },
      { label: 'List the episodes', assist: 'ideas' },
      { label: 'Batch-generate visuals', to: '/influencers' },
      { label: 'Batch captions', assist: 'caption' },
      { label: 'Plan the posting calendar', to: '/content?view=calendar' },
      { label: 'Schedule every episode', to: '/content' },
      { label: 'Review what performed; keep or kill the format' },
    ],
  },
  {
    id: 'brand-deal', name: 'Brand deal campaign', blurb: 'Brief, concept, approvals, delivery and the report.',
    steps: [
      { label: 'Log the brand, fee, deliverables and dates' },
      { label: 'Make the product sheet', to: '/content?view=deals' },
      { label: 'Concept and talking points', assist: 'ideas' },
      { label: 'Produce drafts', to: '/influencers' },
      { label: 'Send for brand approval' },
      { label: 'Revisions' },
      { label: 'Publish with the disclosure tag (#ad)', to: '/content' },
      { label: 'Send the results report and invoice' },
    ],
  },
  {
    id: 'launch', name: 'New influencer launch', blurb: 'From concept to the first nine posts.',
    steps: [
      { label: 'Concept: niche, audience, voice' },
      { label: 'Create the influencer and the face anchor', to: '/create' },
      { label: 'Angle sheet for consistency', to: '/influencers' },
      { label: 'Bio, handle and profile picture' },
      { label: 'Set up the social accounts', to: '/settings?section=accounts' },
      { label: 'Produce the first 9 posts', to: '/influencers' },
      { label: 'Schedule launch week', to: '/content?view=calendar' },
      { label: 'Track similar creators for benchmarks', to: '/content?view=ideas' },
    ],
  },
  { id: 'blank', name: 'Blank project', blurb: 'Start empty and add your own steps.', steps: [] },
]

export function stepsFromTemplate(tplId) {
  const t = PROJECT_TEMPLATES.find(x => x.id === tplId) || PROJECT_TEMPLATES[0]
  return t.steps.map((s, i) => ({ id: `st_${Date.now().toString(36)}_${i}`, ...s, done: false }))
}

export function progress(p) {
  const n = p.steps?.length || 0
  return n ? Math.round((p.steps.filter(s => s.done).length / n) * 100) : 0
}
