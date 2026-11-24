"""Pack coach-playbook/*.md into one file the AI coach reads (supabase/functions/coach/playbook.md).
The coach loads it from the database table coach_content (id 'playbook'). After editing a page:
  1. python scripts/build-playbook.py
  2. upload playbook.md into coach_content (see README, "Updating the coach playbook")."""
import glob, os

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
parts = [open(f, encoding='utf-8').read().strip()
         for f in sorted(glob.glob(os.path.join(root, 'coach-playbook', '[0-9]*.md')))]
text = '\n\n---\n\n'.join(parts)
out = os.path.join(root, 'supabase', 'functions', 'coach', 'playbook.md')
with open(out, 'w', encoding='utf-8', newline='\n') as fh:
    fh.write(text)
print(f'{len(parts)} pages, {len(text):,} characters, ~{len(text)//4:,} tokens -> {out}')
