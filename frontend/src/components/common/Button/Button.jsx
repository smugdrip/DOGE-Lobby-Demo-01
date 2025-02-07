import { useTheme } from 'styled-components';

const Button = ({ children, ...props }) => {
  const theme = useTheme();
  
  const buttonStyle = {
    backgroundColor: theme.colors.primary,
    color: theme.colors.textOnPrimary,
    padding: '10px 20px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '1em',
    fontWeight: '500',
    fontFamily: 'inherit',
    transition: 'border-color 0.25s'
  };

  return (
    <button style={buttonStyle} {...props}>
      {children}
    </button>
  );
};

export default Button;