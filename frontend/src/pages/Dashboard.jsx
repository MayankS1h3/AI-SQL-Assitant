import { Container, Typography, Grid, Paper, Box } from "@mui/material";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/layout/Navbar";
import StorageIcon from "@mui/icons-material/Storage";
import QueryStatsIcon from "@mui/icons-material/QueryStats";
import HistoryIcon from "@mui/icons-material/History";
import { useNavigate } from "react-router-dom";

function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const cards = [
    {
      title: "Database Connections",
      description: "Manage your Supabase database connections",
      icon: <StorageIcon sx={{ fontSize: 60 }} />,
      path: "/connections",
      color: "#1976d2",
    },
    {
      title: "AI Query",
      description: "Generate SQL queries using natural language",
      icon: <QueryStatsIcon sx={{ fontSize: 60 }} />,
      path: "/query",
      color: "#2e7d32",
    },
    {
      title: "Query History",
      description: "View and re-run your past queries",
      icon: <HistoryIcon sx={{ fontSize: 60 }} />,
      path: "/history",
      color: "#ed6c02",
    },
  ];

  return (
    <Box>
      <Navbar />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Welcome, {user?.username}! 👋
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Use AI to query your Supabase databases with natural language
        </Typography>

        <Grid container spacing={3} sx={{ mt: 2 }}>
          {cards.map((card) => (
            <Grid item xs={12} md={4} key={card.title}>
              <Paper
                elevation={3}
                sx={{
                  p: 3,
                  textAlign: "center",
                  cursor: "pointer",
                  transition: "transform 0.2s",
                  "&:hover": {
                    transform: "translateY(-8px)",
                    boxShadow: 6,
                  },
                }}
                onClick={() => navigate(card.path)}
              >
                <Box sx={{ color: card.color, mb: 2 }}>{card.icon}</Box>
                <Typography variant="h6" gutterBottom>
                  {card.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {card.description}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>

        <Paper elevation={2} sx={{ p: 3, mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            How It Works
          </Typography>
          <Typography variant="body2" paragraph>
            1. <strong>Add a Connection:</strong> Connect your Supabase database
            by providing the URL and anon key
          </Typography>
          <Typography variant="body2" paragraph>
            2. <strong>Ask Questions:</strong> Use natural language to describe
            what data you want
          </Typography>
          <Typography variant="body2" paragraph>
            3. <strong>Get Results:</strong> AI generates SQL and executes it
            against your database
          </Typography>
          <Typography variant="body2">
            4. <strong>Review History:</strong> Access and re-run past queries
            anytime
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
}

export default Dashboard;
