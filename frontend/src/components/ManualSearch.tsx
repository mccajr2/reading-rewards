import { Stack, TextField, Button } from '@mui/material';

interface ManualSearchProps {
  title: string;
  setTitle: (t: string) => void;
  author: string;
  setAuthor: (a: string) => void;
  onSearch: () => void;
  loading?: boolean;
}

export default function ManualSearch({ title, setTitle, author, setAuthor, onSearch, loading }: ManualSearchProps) {
  return (
    <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
      <TextField
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="Title"
        onKeyDown={e => { if (e.key === 'Enter' && (title || author)) onSearch(); }}
        size="small"
        sx={{ flex: 1 }}
      />
      <TextField
        value={author}
        onChange={e => setAuthor(e.target.value)}
        placeholder="Author"
        onKeyDown={e => { if (e.key === 'Enter' && (title || author)) onSearch(); }}
        size="small"
        sx={{ flex: 1 }}
      />
      <Button variant="outlined" onClick={onSearch} disabled={loading || (!title && !author)}>Search</Button>
    </Stack>
  );
}
