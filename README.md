# Nairobi Block Exchange (NBX) Backend

## 1. Executive Summary

The Nairobi Block Exchange (NBX) is a blockchain-based SME stock exchange built on the Hedera Hashgraph network. It enables small and medium-sized enterprises (SMEs) to issue security tokens representing company shares, providing investors with access to fractional ownership and liquidity. NBX integrates smart contracts for governance, automated dividend payouts, and regulatory compliance, ensuring a secure, transparent, and efficient capital market for SMEs.

## 2. Introduction

### 2.1 The Problem Statement

Access to capital remains a significant challenge for SMEs, with traditional stock exchanges imposing high listing costs and strict regulatory requirements. As a result, many SMEs struggle to secure funding through equity markets, limiting their growth potential.

The general public also have a barrier of entry into investement are are there fore sidelined in nation building.

By bringing more of the population into the investment space, we can help to build a more inclusive and equitable economy.

### 2.2 The Solution

NBX leverages blockchain technology to facilitate the issuance and trading of security tokens, democratizing access to investment opportunities while ensuring transparency, regulatory compliance, and security.

## 3. Technology Stack

- **Blockchain Infrastructure**: Hedera Hashgraph for fast, low-cost, and secure transactions.
- **Security Tokens**: Hedera Token Service (HTS) for tokenized shares.
- **Smart Contracts**: Enforce investor rights, dividend payouts, and governance.
- **KYC/AML Compliance**: Identity verification and whitelisting of investors.
- **Auditing & Regulatory Access**: Real-time financial data accessible by regulators.

## 4. User Roles & Flow

### 4.1 Individual Investors

- Sign up and complete KYC/AML verification.
- Fund wallets with HBAR or stablecoins.
- Browse and invest in tokenized SME shares.
- Trade shares on the secondary market.
- Receive dividends and participate in governance voting.

### 4.2 SACCOs & Institutions

- Conduct bulk investments in SME shares.
- Manage portfolios with institutional-grade compliance.
- Provide liquidity by trading shares on NBX.
- Stake tokens for governance influence.

### 4.3 Regulators (Auditors)

- Access real-time blockchain transactions.
- Verify financial disclosures from SMEs.
- Ensure compliance with securities laws.
- Monitor and flag suspicious activities.

### 4.4 Companies (SMEs)

- Register and verify company details.
- Issue security tokens representing shares.
- Manage shareholder communications and voting.
- Distribute dividends via smart contracts.

## 5. Tokenomics & Governance

### 5.1 Token Supply & Distribution

- **Total Supply**: Determined per company listing (e.g., 1M tokens = 1M shares).
- **Founders' Allocation**: Reserved portion for early investors and advisors.
- **Public Sale (IPO/STO)**: Offering security tokens to investors.

### 5.2 Trading Fees & Platform Revenue

- **Transaction Fees**: Small percentage on every trade.
- **Listing Fees**: Companies pay to list their tokens.
- **Staking & Governance**: Investors can stake tokens for voting rights.

### 5.3 Liquidity Incentives

- **Market Makers**: Incentivized to provide liquidity.
- **Automated Market Maker (AMM) Model**: Ensures dynamic token pricing.

## 6. Compliance & Regulation

- **KYC/AML Verification**: Investors must complete identity verification before trading.
- **Regulatory Oversight**: On-chain compliance reporting for transparency.
- **Investor Protection**: Smart contracts enforce compliance and prevent fraud.

## 7. Roadmap & Implementation Plan

### Phase 1: Platform Development

- Develop NBX's smart contracts and security token infrastructure.
- Integrate KYC/AML solutions for investor verification.
- Build an intuitive UI for trading and portfolio management.

### Phase 2: Pilot Testing & Regulatory Compliance

- Partner with SMEs for test listings.
- Work with regulators to refine compliance features.
- Conduct security audits of the platform.

### Phase 3: Public Launch & Market Expansion

- Onboard SMEs and investors.
- Expand to institutional investors and SACCOs.
- Implement liquidity pools and governance mechanisms.

## 8. Conclusion & Future Vision

NBX aims to become Africa's premier blockchain-powered SME stock exchange, providing seamless access to capital markets while ensuring transparency and regulatory compliance. Through tokenized securities, automated governance, and decentralized trading, NBX will empower SMEs and investors alike, fostering economic growth and innovation.

## Development

This backend is built with NestJS and Mongoose for MongoDB integration.

### Installation

```bash
npm install
```

### Running the app

```bash
# development
npm run start:dev

# production
npm run start:prod
```

### Testing

```bash
# unit tests
npm run test

# e2e tests
npm run test:e2e

# coverage
npm run test:cov
```

### Linting and Formatting

```bash
npm run lint
npm run format
```
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
