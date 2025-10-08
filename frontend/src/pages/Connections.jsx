import { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  CardActions,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  IconButton,
} from "@mui/material";
import Navbar from "../components/layout/Navbar";
import { connectionsAPI } from "../services/api";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import StorageIcon from "@mui/icons-material/Storage";

function Connections() {
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [editingConnection, setEditingConnection] = useState(null);
  const [formData, setFormData] = useState({
    nickname: "",
    supabaseUrl: "",
    supabaseAnonKey: "",
  });
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchConnections();
  }, []);

  const fetchConnections = async () => {
    try {
      setLoading(true);
      const response = await connectionsAPI.getAll();
      console.log("Connections response:", response.data);
      setConnections(response.data.data?.connections || []);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load connections");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (connection = null) => {
    if (connection) {
      setEditingConnection(connection);
      setFormData({
        nickname: connection.nickname,
        supabaseUrl: connection.supabaseUrl,
        supabaseAnonKey: "", // Don't show the key for security
      });
    } else {
      setEditingConnection(null);
      setFormData({
        nickname: "",
        supabaseUrl: "",
        supabaseAnonKey: "",
      });
    }
    setFormError("");
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingConnection(null);
    setFormData({
      nickname: "",
      supabaseUrl: "",
      supabaseAnonKey: "",
    });
    setFormError("");
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);

    try {
      if (editingConnection) {
        // Only send fields that have values for update
        const updateData = {
          nickname: formData.nickname,
        };
        if (formData.supabaseUrl) updateData.supabaseUrl = formData.supabaseUrl;
        if (formData.supabaseAnonKey) updateData.supabaseAnonKey = formData.supabaseAnonKey;
        
        await connectionsAPI.update(editingConnection._id, updateData);
      } else {
        await connectionsAPI.add(formData);
      }
      await fetchConnections();
      handleCloseDialog();
    } catch (err) {
      setFormError(err.response?.data?.message || "Operation failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this connection?")) {
      return;
    }

    try {
      await connectionsAPI.delete(id);
      await fetchConnections();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete connection");
    }
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
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4">Database Connections</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Add Connection
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {connections.length === 0 ? (
          <Card>
            <CardContent sx={{ textAlign: "center", py: 6 }}>
              <StorageIcon sx={{ fontSize: 80, color: "text.secondary", mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No connections yet
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Add your first Supabase database connection to get started
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog()}
              >
                Add Connection
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Grid container spacing={3}>
            {connections.map((connection) => (
              <Grid item xs={12} md={6} key={connection._id}>
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center" mb={1}>
                      <StorageIcon sx={{ mr: 1, color: "primary.main" }} />
                      <Typography variant="h6">{connection.nickname}</Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {connection.supabaseUrl}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                      Added: {new Date(connection.createdAt).toLocaleDateString()}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handleOpenDialog(connection)}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(connection._id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>
            {editingConnection ? "Edit Connection" : "Add New Connection"}
          </DialogTitle>
          <form onSubmit={handleSubmit}>
            <DialogContent>
              {formError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {formError}
                </Alert>
              )}
              <TextField
                fullWidth
                label="Nickname"
                name="nickname"
                value={formData.nickname}
                onChange={handleChange}
                margin="normal"
                required
                helperText="A friendly name for this connection"
              />
              <TextField
                fullWidth
                label="Supabase URL"
                name="supabaseUrl"
                value={formData.supabaseUrl}
                onChange={handleChange}
                margin="normal"
                required={!editingConnection}
                placeholder="https://your-project.supabase.co"
                helperText={editingConnection ? "Leave empty to keep existing" : "Your Supabase project URL"}
              />
              <TextField
                fullWidth
                label="Supabase Anon Key"
                name="supabaseAnonKey"
                value={formData.supabaseAnonKey}
                onChange={handleChange}
                margin="normal"
                required={!editingConnection}
                type="password"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                helperText={editingConnection ? "Leave empty to keep existing" : "Your Supabase anon/public key"}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>Cancel</Button>
              <Button type="submit" variant="contained" disabled={submitting}>
                {submitting ? <CircularProgress size={24} /> : editingConnection ? "Update" : "Add"}
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      </Container>
    </Box>
  );
}

export default Connections;
