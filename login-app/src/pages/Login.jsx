
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link as RouterLink } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  IconButton,
  InputAdornment,
  Link,
  Paper,
  TextField,
  Typography,
} from "@mui/material";

import {
  Visibility,
  VisibilityOff,
  LockOutlined,
} from "@mui/icons-material";

import {
  registerUser,
  loginUser,
  logoutUser,
  fetchMe,
  clearError,
} from "../features/auth/authSlice";

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { user, isLoggedIn, loading, error, initialized } =
    useSelector((state) => state.auth);

  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState("");
  const [registerMessage, setRegisterMessage] = useState("");

  useEffect(() => {
    dispatch(fetchMe());
  }, [dispatch]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    setFormError("");
    setRegisterMessage("");
    dispatch(clearError());

    if (!email.trim() || !password || (isRegister && !name.trim())) {
      setFormError("Please fill in all required fields.");
      return;
    }

    if (isRegister && password.length < 12) {
      setFormError("Password must contain at least 12 characters.");
      return;
    }

    if (
      isRegister &&
      new TextEncoder().encode(password).length > 72
    ) {
      setFormError("Password must not exceed 72 UTF-8 bytes.");
      return;
    }

    try {
      if (isRegister) {
        const result = await dispatch(
          registerUser({
            name: name.trim(),
            email: email.trim(),
            password,
          })
        ).unwrap();

        setRegisterMessage(
          result.message ||
            "Registration successful. Check your email and verify your account before logging in."
        );

        setIsRegister(false);
        setName("");
        setEmail("");
        setPassword("");
      } else {
        await dispatch(
          loginUser({
            email: email.trim(),
            password,
          })
        ).unwrap();

        navigate("/dashboard");

        setName("");
        setEmail("");
        setPassword("");
      }
    } catch {
      // Redux stores the API error.
    }
  };

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser()).unwrap();

      setIsRegister(false);
      setPassword("");
      setRegisterMessage("");
    } catch {
      // Keep the current UI if logout fails.
    }
  };

  if (!initialized) {
    return (
      <Container className="page-container">
        <CircularProgress />
      </Container>
    );
  }

  if (isLoggedIn && user) {
    return (
      <Container maxWidth="sm" className="page-container">
        <Paper elevation={5} className="login-card">
          <Box className="icon-circle">
            <LockOutlined fontSize="large" />
          </Box>

          <Typography variant="h4" fontWeight="bold">
            Welcome, {user.name}!
          </Typography>

          <Typography sx={{ mt: 2, mb: 3 }}>
            {user.email}
          </Typography>

          <Button
            fullWidth
            variant="contained"
            onClick={handleLogout}
            disabled={loading}
          >
            Logout
          </Button>

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" className="page-container">
      <Paper elevation={5} className="login-card">
        <Box className="icon-circle">
          <LockOutlined fontSize="large" />
        </Box>

        <Typography variant="h4" fontWeight="bold" gutterBottom>
          {isRegister ? "Create Account" : "Welcome Back"}
        </Typography>

        <Typography color="text.secondary" sx={{ mb: 3 }}>
          {isRegister
            ? "Register to get started"
            : "Login to your account"}
        </Typography>

        {registerMessage && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {registerMessage}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          {isRegister && (
            <TextField
              fullWidth
              label="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              margin="normal"
              autoComplete="name"
              required
            />
          )}

          <TextField
            fullWidth
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            margin="normal"
            autoComplete="email"
            required
          />

          <TextField
            fullWidth
            label="Password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            margin="normal"
            autoComplete={
              isRegister ? "new-password" : "current-password"
            }
            required
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() =>
                        setShowPassword((value) => !value)
                      }
                      edge="end"
                      aria-label="toggle password visibility"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />

          {!isRegister && (
            <Box sx={{ textAlign: "right", mt: 1 }}>
              <Link
                component={RouterLink}
                to="/forgot-password"
                underline="hover"
              >
                Forgot Password?
              </Link>
            </Box>
          )}

          {(formError || error) && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {formError || error}
            </Alert>
          )}

          <Button
            fullWidth
            type="submit"
            variant="contained"
            size="large"
            disabled={loading}
            sx={{ mt: 3, py: 1.5, borderRadius: 2 }}
          >
            {loading
              ? "Please wait..."
              : isRegister
                ? "Register"
                : "Login"}
          </Button>

          <Button
            fullWidth
            sx={{ mt: 2 }}
            onClick={() => {
              setIsRegister((value) => !value);
              setFormError("");
              setRegisterMessage("");
              dispatch(clearError());
            }}
          >
            {isRegister
              ? "Already have an account? Login"
              : "New user? Create an account"}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}
