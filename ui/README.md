# Solana Staking Platform

A modern Next.js-based frontend for a Solana staking platform that allows users to stake SOL tokens and earn rewards. Built with Next.js 13+, TypeScript, and Solana Web3.js.

## Features

- 🔐 Secure wallet connection using Solana Wallet Adapter
- 💰 SOL token staking with multiple duration options
- 📊 Real-time balance and staking information
- 🎯 Admin dashboard for platform management
- 🎨 Modern UI with dark theme
- 📱 Fully responsive design
- 🔄 Real-time transaction updates
- 🎯 Toast notifications for transaction status

## Tech Stack

- **Framework**: Next.js 13+ (App Router)
- **Language**: TypeScript
- **Blockchain**: Solana
- **Web3**: 
  - @solana/web3.js
  - @solana/wallet-adapter-react
  - @coral-xyz/anchor
- **UI Libraries**:
  - Tailwind CSS
  - Radix UI
  - Lucide React
  - Sonner (Toast notifications)

## Prerequisites

- Node.js 18+ 
- npm or yarn
- Solana CLI tools
- A Solana wallet (e.g., Phantom)

## Getting Started

1. Clone the repository:
```bash
git clone <repository-url>
cd staking-new-frontend
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Create a `.env.local` file in the root directory and add your environment variables:
```env
NEXT_PUBLIC_RPC_URL=<your-solana-rpc-url>
```

4. Run the development server:
```bash
npm run dev
# or
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

```
staking-new-frontend/
├── app/                 # Next.js app directory
│   ├── admin/          # Admin dashboard pages
│   ├── layout.tsx      # Root layout
│   └── page.tsx        # Home page
├── components/         # React components
│   ├── provider/      # Context providers
│   ├── hooks/         # Custom hooks
│   └── ui/            # UI components
├── lib/               # Utility functions
└── public/            # Static assets
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Features in Detail

### Staking
- Multiple staking duration options (7, 14, 30, 90 days)
- Real-time balance updates
- Transaction confirmation notifications
- APY display

### Admin Dashboard
- Platform statistics
- User management
- Transaction monitoring
- System configuration

### Security
- Secure wallet connection
- Transaction validation
- Error handling
- Protected admin routes

## Contributing
 
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, please open an issue in the GitHub repository or contact the development team.
