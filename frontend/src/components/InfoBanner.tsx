import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

export default function InfoBanner({ title, description }: { title: string; description: string }) {
  return (
    <Box sx={{
      p: 2,
      mb: 3,
      bgcolor: 'rgba(255, 184, 28, 0.1)',
      border: '2px solid #FFB81C',
      borderRadius: 2
    }}>
      <Typography variant="h5" fontWeight={700} sx={{ color: '#FFB81C', display: 'inline' }}>
        {title}
      </Typography>
      <Typography variant="body1" fontWeight={500}>
        {description}
      </Typography>
    </Box>
  );
}