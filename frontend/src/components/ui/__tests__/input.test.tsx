import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Input } from '../input';
import userEvent from '@testing-library/user-event';

describe('Input Component', () => {
  it('should render input field', () => {
    render(<Input placeholder="Enter text" />);
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
  });

  it('should handle text input', async () => {
    render(<Input placeholder="Enter text" />);
    const input = screen.getByPlaceholderText('Enter text') as HTMLInputElement;
    
    await userEvent.type(input, 'Hello World');
    
    expect(input.value).toBe('Hello World');
  });

  it('should apply custom className', () => {
    const { container } = render(<Input className="custom-input" />);
    const input = container.querySelector('input');
    expect(input?.className).toContain('custom-input');
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Input disabled placeholder="Disabled input" />);
    const input = screen.getByPlaceholderText('Disabled input');
    expect(input).toBeDisabled();
  });

  it('should handle different input types', () => {
    const { rerender } = render(<Input type="email" data-testid="email-input" />);
    expect(screen.getByTestId('email-input')).toHaveAttribute('type', 'email');
    
    rerender(<Input type="password" data-testid="password-input" />);
    expect(screen.getByTestId('password-input')).toHaveAttribute('type', 'password');
  });
});
