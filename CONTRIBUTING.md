# Contributing to Vine Church Cafeteria

Thank you for considering contributing to this project! Here are some guidelines to help you get started.

## Development Setup

1. Follow the setup instructions in SETUP.md
2. Create a new branch for your feature: `git checkout -b feature/your-feature-name`
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Code Style

- Use TypeScript for new files in the `/app` directory
- Follow existing code formatting
- Use meaningful variable and function names
- Add comments for complex logic

## Project Structure

```
/app          - Next.js app router pages (TypeScript)
  /items      - Items management page
  /orders     - Orders management page
/pages/api    - API routes (JavaScript)
/lib          - Shared utilities and configurations
/public       - Static assets
```

## Adding New Features

### Adding a New API Endpoint

1. Create a new file in `/pages/api/`
2. Follow the pattern in `items.js` or `orders.js`
3. Use the Supabase client from `/lib/supabase.ts`
4. Handle all HTTP methods appropriately
5. Add proper error handling

Example:
```javascript
import { supabase } from '../../lib/supabase';

export default async function handler(req, res) {
  const { method } = req;
  
  switch (method) {
    case 'GET':
      // Handle GET
      break;
    case 'POST':
      // Handle POST
      break;
    default:
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).end(`Method ${method} Not Allowed`);
  }
}
```

### Adding a New Page

1. Create a new directory in `/app`
2. Add a `page.tsx` file
3. Use TypeScript and React hooks
4. Follow the existing UI patterns with Tailwind CSS

Example:
```typescript
'use client';

import { useState, useEffect } from 'react';

export default function NewPage() {
  const [data, setData] = useState([]);
  
  return (
    <div className="min-h-screen p-8 bg-gray-50">
      {/* Your content */}
    </div>
  );
}
```

## Database Changes

If you need to modify the database schema:

1. Test changes in your Supabase project
2. Update `database-setup.sql` with migration script
3. Document changes in the pull request
4. Consider backward compatibility

## Testing

Before submitting a PR:

1. Test all CRUD operations
2. Check UI on different screen sizes
3. Verify error handling
4. Test with empty states
5. Run: `npm run build` to ensure production build works

## Pull Request Process

1. Update README.md if needed
2. Update SETUP.md if setup process changes
3. Describe your changes clearly
4. Reference any related issues
5. Wait for review and address feedback

## Code Review Checklist

- [ ] Code follows existing style
- [ ] No console errors or warnings
- [ ] Responsive design works on mobile
- [ ] Error states are handled
- [ ] Loading states are shown
- [ ] Success/failure messages are clear
- [ ] No hardcoded credentials or secrets
- [ ] TypeScript types are used where applicable

## Feature Ideas

Here are some features that could be added:

- User authentication
- Report generation (daily sales, popular items)
- Inventory tracking
- Multiple payment methods
- Receipt printing
- Order status tracking (preparing, ready, delivered)
- Customer history
- Discount codes
- Tax calculations
- Multi-location support

## Questions?

If you have questions or need help:
- Open an issue on GitHub
- Review existing issues and pull requests
- Check SETUP.md and README.md

## License

By contributing, you agree that your contributions will be licensed under the same license as the project (MIT).
