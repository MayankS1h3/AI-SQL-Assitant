import { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Box,
  Paper,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import Navbar from "../components/layout/Navbar";
import { historyAPI } from "../services/api";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import HistoryIcon from "@mui/icons-material/History";
import CodeIcon from "@mui/icons-material/Code";
import AccessTimeIcon from "@mui/icons-material/AccessTime";

function History() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await historyAPI.getAll();
      setHistory(response.data.data?.history || []);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load history");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  if (loading) {
    return (
      <Box>
        <Navbar />
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
          <CircularProgress />
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      <Navbar />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Query History
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          View your past queries and results
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {history.length === 0 ? (
          <Card>
            <CardContent sx={{ textAlign: "center", py: 6 }}>
              <HistoryIcon sx={{ fontSize: 80, color: "text.secondary", mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No query history yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Execute some queries to see them here
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Box>
            {history.map((item, index) => (
              <Accordion key={item._id} defaultExpanded={index === 0}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ width: "100%", display: "flex", alignItems: "center", gap: 2 }}>
                    <HistoryIcon color="primary" />
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="subtitle1">
                        {item.naturalLanguageQuery}
                      </Typography>
                      <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                        <AccessTimeIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(item.createdAt)}
                        </Typography>
                        <Chip
                          label={item.connectionNickname || "Unknown DB"}
                          size="small"
                          sx={{ ml: 1 }}
                        />
                      </Box>
                    </Box>
                    <Chip
                      label={item.status === 'success' ? "Success" : "Failed"}
                      color={item.status === 'success' ? "success" : "error"}
                      size="small"
                    />
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Box>
                    {/* Generated SQL */}
                    <Paper elevation={1} sx={{ p: 2, mb: 2, bgcolor: "grey.50" }}>
                      <Box display="flex" alignItems="center" mb={1}>
                        <CodeIcon sx={{ mr: 1, fontSize: 18 }} />
                        <Typography variant="subtitle2">Generated SQL</Typography>
                      </Box>
                      <Box
                        sx={{
                          fontFamily: "monospace",
                          fontSize: "0.85rem",
                          whiteSpace: "pre-wrap",
                          wordBreak: "break-word",
                        }}
                      >
                        {item.generatedSql}
                      </Box>
                    </Paper>

                    {/* Execution Info */}
                    <Box display="flex" gap={2} mb={2}>
                      {item.executionTime && (
                        <Chip
                          label={`Execution: ${item.executionTime}ms`}
                          size="small"
                          variant="outlined"
                        />
                      )}
                      {item.rowCount !== undefined && item.rowCount !== null && (
                        <Chip
                          label={`${item.rowCount} rows`}
                          size="small"
                          variant="outlined"
                          color="primary"
                        />
                      )}
                    </Box>

                    {/* Results or Error */}
                    {item.status === 'success' ? (
                      <Alert severity="success">
                        Query executed successfully{item.rowCount !== undefined ? ` (${item.rowCount} rows returned)` : ''}
                      </Alert>
                    ) : (
                      <Alert severity="error">
                        {item.errorMessage || "Query execution failed"}
                      </Alert>
                    )}
                  </Box>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        )}
      </Container>
    </Box>
  );
}

export default History;
