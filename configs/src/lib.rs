//! Configuration utilities for the AI Agency Platform
//!
//! This crate provides shared configuration management functionality.

/// Configuration module placeholder
pub mod config {
    /// Returns the default configuration path
    pub fn default_path() -> &'static str {
        ".config"
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_default_path() {
        assert_eq!(config::default_path(), ".config");
    }
}
