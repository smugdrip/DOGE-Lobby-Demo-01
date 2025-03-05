import { useTheme } from 'styled-components';
import PropTypes from 'prop-types';

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
Button.propTypes = {
  children: PropTypes.node.isRequired,
};

export default Button;