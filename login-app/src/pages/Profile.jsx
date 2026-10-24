
import { useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  TextField,
  Typography,
} from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { fetchMe } from "../features/auth/authSlice";
import axios from "../api/axios";

export default function Profile() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const [name, setName] = useState(user?.name || "");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSave = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");

    if (!name.trim()) {
      setError("Name is required.");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.put("/auth/profile", {
        name: name.trim(),
      });

      setMessage(response.data.message);
      await dispatch(fetchMe()).unwrap();
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to update profile."
      );
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <Container sx={{ mt: 5 }}>
        <Typography>Please log in to view your profile.</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ py: 5 }}>
      <Card elevation={3}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ textAlign: "center", mb: 3 }}>
            <Avatar
              sx={{
                width: 80,
                height: 80,
                mx: "auto",
                mb: 2,
                fontSize: 32,
              }}
            >
              {user.name?.charAt(0).toUpperCase()}
            </Avatar>

            <Typography variant="h4" fontWeight="bold">
              My Profile
            </Typography>
          </Box>

          {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Box component="form" onSubmit={handleSave}>
            <TextField
              label="Full Name"
              fullWidth
              required
              margin="normal"
              value={name}
              onChange={(event) => setName(event.target.value)}
              slotProps={{ htmlInput: { maxLength: 80 } }}
            />

            <TextField
              label="Email Address"
              fullWidth
              margin="normal"
              value={user.email}
              slotProps={{ input: { readOnly: true } }}
              helperText="Email address cannot be changed here."
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3 }}
              disabled={loading}
            >
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
}
