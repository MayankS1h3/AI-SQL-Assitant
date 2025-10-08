import { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Box,
  Paper,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress,
  Divider,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import Navbar from "../components/layout/Navbar";
import { connectionsAPI, queryAPI } from "../services/api";
import SendIcon from "@mui/icons-material/Send";
import CodeIcon from "@mui/icons-material/Code";
import TableChartIcon from "@mui/icons-material/TableChart";

function Query() {
  const [connections, setConnections] = useState([]);
  const [selectedConnection, setSelectedConnection] = useState("");
  const [naturalLanguageQuery, setNaturalLanguageQuery] = useState("");
  const [generatedSQL, setGeneratedSQL] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [loadingConnections, setLoadingConnections] = useState(true);

  useEffect(() => {
    fetchConnections();
  }, []);

  const fetchConnections = async () => {
    try {
      setLoadingConnections(true);
      const response = await connectionsAPI.getAll();
      setConnections(response.data.data?.connections || []);
    } catch (err) {
      setError("Failed to load connections");
    } finally {
      setLoadingConnections(false);
    }
  };

  const handleExecuteQuery = async () => {
    if (!selectedConnection) {
      setError("Please select a database connection");
      return;
    }

    if (!naturalLanguageQuery.trim()) {
      setError("Please enter a query");
      return;
    }

    setLoading(true);
    setError("");
    setGeneratedSQL("");
    setResults(null);

    try {
      const response = await queryAPI.execute({
        connectionId: selectedConnection,
        naturalLanguageQuery: naturalLanguageQuery.trim(),
      });

      setGeneratedSQL(response.data.data.generatedSQL);
      setResults(response.data.data.results);
    } catch (err) {
      setError(err.response?.data?.message || "Query execution failed");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && e.ctrlKey) {
      handleExecuteQuery();
    }
  };

  return (
    <Box>
      <Navbar />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          AI Query Interface
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Ask questions in natural language and get SQL results
        </Typography>

        {loadingConnections ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : connections.length === 0 ? (
          <Alert severity="warning" sx={{ mb: 3 }}>
            No database connections found. Please add a connection first.
          </Alert>
        ) : (
          <>
            <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Select Database</InputLabel>
                <Select
                  value={selectedConnection}
                  onChange={(e) => setSelectedConnection(e.target.value)}
                  label="Select Database"
                >
                  {connections.map((conn) => (
                    <MenuItem key={conn._id} value={conn._id}>
                      {conn.nickname} - {conn.supabaseUrl}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                fullWidth
                multiline
                rows={4}
                label="Natural Language Query"
                placeholder="e.g., Show me all users who signed up in the last 7 days"
                value={naturalLanguageQuery}
                onChange={(e) => setNaturalLanguageQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                sx={{ mb: 2 }}
              />

              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="caption" color="text.secondary">
                  Press Ctrl+Enter to execute
                </Typography>
                <Button
                  variant="contained"
                  endIcon={loading ? <CircularProgress size={20} /> : <SendIcon />}
                  onClick={handleExecuteQuery}
                  disabled={loading || !selectedConnection}
                >
                  {loading ? "Executing..." : "Execute Query"}
                </Button>
              </Box>
            </Paper>

            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            {generatedSQL && (
              <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
                <Box display="flex" alignItems="center" mb={2}>
                  <CodeIcon sx={{ mr: 1, color: "primary.main" }} />
                  <Typography variant="h6">Generated SQL</Typography>
                  <Chip label="SELECT" size="small" color="success" sx={{ ml: 2 }} />
                </Box>
                <Box
                  sx={{
                    bgcolor: "grey.100",
                    p: 2,
                    borderRadius: 1,
                    fontFamily: "monospace",
                    fontSize: "0.9rem",
                    overflowX: "auto",
                  }}
                >
                  {generatedSQL}
                </Box>
              </Paper>
            )}

            {results && (
              <Paper elevation={2} sx={{ p: 3 }}>
                <Box display="flex" alignItems="center" mb={2}>
                  <TableChartIcon sx={{ mr: 1, color: "success.main" }} />
                  <Typography variant="h6">Results</Typography>
                  <Chip
                    label={`${Array.isArray(results) ? results.length : 0} rows`}
                    size="small"
                    sx={{ ml: 2 }}
                  />
                </Box>

                {Array.isArray(results) && results.length > 0 ? (
                  <TableContainer sx={{ maxHeight: 440 }}>
                    <Table stickyHeader size="small">
                      <TableHead>
                        <TableRow>
                          {Object.keys(results[0]).map((column) => (
                            <TableCell key={column}>
                              <strong>{column}</strong>
                            </TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {results.map((row, index) => (
                          <TableRow key={index} hover>
                            {Object.values(row).map((value, i) => (
                              <TableCell key={i}>
                                {value === null
                                  ? "NULL"
                                  : typeof value === "object"
                                  ? JSON.stringify(value)
                                  : String(value)}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Alert severity="info">No results returned</Alert>
                )}
              </Paper>
            )}
          </>
        )}
      </Container>
    </Box>
  );
}

export default Query;
