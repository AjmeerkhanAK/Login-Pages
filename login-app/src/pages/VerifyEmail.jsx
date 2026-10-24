
import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Paper,
  Typography,
} from "@mui/material";
import { Link as RouterLink, useSearchParams } from "react-router-dom";
import axios from "../api/axios";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();

  const token = searchParams.get("token") || "";
  const email = searchParams.get("email") || "";

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const verify = async () => {
      if (!token || !email) {
        setError("This verification link is invalid or incomplete.");
        setLoading(false);
        return;
      }

      try {
        const response = await axios.post("/auth/verify-email", {
          token,
          email,
        });

        if (!cancelled) {
          setMessage(
            response.data.message ||
              "Email verified successfully. You can now log in."
          );
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.response?.data?.message ||
              "Unable to verify your email. The link may have expired."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    verify();

    return () => {
      cancelled = true;
    };
  }, [token, email]);

  return (
    <Container maxWidth="sm">
      <Paper elevation={4} sx={{ mt: 8, p: 4, borderRadius: 3 }}>
        <Box textAlign="center">
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Email Verification
          </Typography>

          <Typography color="text.secondary" sx={{ mb: 3 }}>
            We're checking your verification link.
          </Typography>

          {loading && <CircularProgress />}

          {!loading && message && (
            <Alert severity="success" sx={{ mb: 3 }}>
              {message}
            </Alert>
          )}

          {!loading && error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {!loading && (
            <Button
              component={RouterLink}
              to="/login"
              variant="contained"
              fullWidth
            >
              Go to Login
            </Button>
          )}
        </Box>
      </Paper>
    </Container>
  );
}
