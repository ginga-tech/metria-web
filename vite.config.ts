import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

function getGitMetadata() {
  try {
    const execSync = eval('require')('child_process').execSync as (command: string) => { toString: () => string }
    const sha = execSync('git rev-parse --short HEAD').toString().trim()
    const committedAt = execSync('git show -s --format=%cI HEAD').toString().trim()
    return { sha, committedAt }
  } catch {
    return { sha: 'unknown', committedAt: '' }
  }
}

const git = getGitMetadata()

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    'import.meta.env.VITE_COMMIT_SHA': JSON.stringify(git.sha),
    'import.meta.env.VITE_COMMIT_DATE': JSON.stringify(git.committedAt),
  },
})
