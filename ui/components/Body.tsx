'use client'
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { PublicKey } from '@solana/web3.js';
import { useConnection } from '@solana/wallet-adapter-react';
import './body.css';
import { useProgram } from "./hooks/useProgram";
import * as anchor from "@coral-xyz/anchor";
import { toast } from "sonner";
import { ToastContent } from "./ToastContent";

interface PlayerAccount {
    stakedAmount: number;
    stakedTime: anchor.BN;
    durationTime: anchor.BN;
    rewardAmount: anchor.BN;
}

interface DurationButton {
    id: number;
    durName: string;
    durVal: number;
    isActive: boolean;
}

const STAKE_NAME = "SOL";
const authority = new PublicKey("7ivunejTCC3g6gWqYZqVRpthdyj29vPmVas5YcCy5Yh8");

const initialButtonsData: DurationButton[] = [
    { id: 0, durName: "7 days", durVal: 7, isActive: true },
    { id: 1, durName: "14 days", durVal: 14, isActive: false },
    { id: 2, durName: "30 days", durVal: 30, isActive: false },
    { id: 3, durName: "90 days", durVal: 90, isActive: false },
];

export const Body = () => {
    const { program, publicKey } = useProgram();
    const { connection } = useConnection();
    
    // State management
    const [buttons, setButtons] = useState<DurationButton[]>(initialButtonsData);
    const [balance, setBalance] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(false);
    const [stakeAmount, setStakeAmount] = useState<number>(0);
    const [stakedAmount, setStakedAmount] = useState<number>(0);
    const [stakeType, setStakeType] = useState<number>(7);
    const [stakeTime, setStakeTime] = useState<string>('');
    const [rewardAmount, setRewardAmount] = useState<number>(0);
    const [stakedDuration, setStakedDuration] = useState<number>(0);

    // Memoized values
    const stakeTypeInSeconds = useMemo(() => stakeType * 86400, [stakeType]);
    const stakeAmountInLamports = useMemo(() => stakeAmount * 1e9, [stakeAmount]);

    // Callbacks
    const getPlayerData = useCallback(async (player: PublicKey): Promise<PlayerAccount | null> => {
        const [playerPDA] = PublicKey.findProgramAddressSync(
            [Buffer.from('player'), authority.toBuffer(), player.toBuffer()],
            program.programId
        );
        try {
            return await program.account.playerAccount.fetch(playerPDA) as PlayerAccount;
        } catch(e) {
            return null;
        }
    }, [program]);

    const refreshBalances = useCallback(async () => {
        if (!publicKey) return;
        
        try {
            const balance = await connection.getBalance(publicKey);
            setBalance(balance / 1e9);
            
            const player = await getPlayerData(publicKey);
            setStakedAmount(Number(player?.stakedAmount || 0) / 1e9);
            setStakedDuration(Number(player?.durationTime || 0));
            setRewardAmount(Number(player?.rewardAmount || 0) / 1e9);
            setStakeTime(player?.stakedTime.toString() || '');
        } catch (error) {
            console.error("Error refreshing balances:", error);
        }
    }, [publicKey, connection, getPlayerData]);

    const handleStakeAmountChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const amount = e.target.value;
        if (!amount || amount.match(/^\d{1,}(\.\d{0,2})?$/)) {
            setStakeAmount(Number(amount));
        }
    }, []);

    const handleDurationChange = useCallback((id: number) => {
        setButtons(prevButtons => prevButtons.map(button => ({
            ...button,
            isActive: id === button.id
        })));
        setStakeType(buttons.find(btn => btn.id === id)?.durVal || 7);
    }, [buttons]);

    // Transaction handlers
    const handleTransaction = useCallback(async (
        action: () => Promise<string>,
        loadingMessage: string,
        successMessage: string,
        errorMessage: string
    ) => {
        if (!publicKey) {
            toast.warning("Please connect your wallet");
            return;
        }

        const toastId = toast.loading(loadingMessage);
        setLoading(true);

        try {
            const txSignature = await action();
            const explorerUrl = `https://explorer.solana.com/tx/${txSignature}?cluster=devnet`;
            
            toast.success(successMessage, {
                description: <ToastContent transactionSignature={txSignature} explorerUrl={explorerUrl} />,
                style: {
                    backgroundColor: "#1f1f23",
                    border: "1px solid rgba(139, 92, 246, 0.3)",
                    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.5)",
                },
                duration: 8000,
                id: toastId
            });

            await refreshBalances();
        } catch (err) {
            console.error(`Error: ${errorMessage}`, err);
            toast.error(errorMessage, {
                description: err instanceof Error ? err.message : String(err),
                style: {
                    border: "1px solid rgba(239, 68, 68, 0.3)",
                    background: "linear-gradient(to right, rgba(40, 27, 27, 0.95), rgba(28, 23, 23, 0.95))",
                },
                duration: 5000,
                id: toastId
            });
        } finally {
            setLoading(false);
        }
    }, [publicKey, refreshBalances]);

    const stake = useCallback(async () => {
        if (!publicKey) {
            toast.warning("Please connect your wallet");
            return;
        }

        if (stakeAmount <= 0) {
            toast.error("Please enter a valid amount");
            return;
        }

        if (stakeAmount > balance) {
            toast.error("Insufficient balance");
            return;
        }

        await handleTransaction(
            () => program.methods
                .solStake(new anchor.BN(stakeAmountInLamports), new anchor.BN(stakeTypeInSeconds))
                .accounts({ authority, player: publicKey as PublicKey })
                .rpc(),
            "Staking...",
            "Staking Successful!",
            "Staking Failed"
        );

        setStakeAmount(0);
    }, [stakeAmount, balance, stakeAmountInLamports, stakeTypeInSeconds, program, publicKey, handleTransaction]);

    const unstake = useCallback(async () => {
        if (!publicKey) {
            toast.warning("Please connect your wallet");
            return;
        }

        const player = await getPlayerData(publicKey);
        if (!player || player.stakedAmount === 0) {
            toast.error("No staked amount found");
            return;
        }

        await handleTransaction(
            () => program.methods
                .solUnstake()
                .accounts({ authority, player: publicKey as PublicKey })
                .rpc(),
            "Unstaking...",
            "Unstaking Successful!",
            "Unstaking Failed"
        );
    }, [publicKey, getPlayerData, program, handleTransaction]);

    const claimRewards = useCallback(async () => {
        if (!publicKey) {
            toast.warning("Please connect your wallet");
            return;
        }

        const player = await getPlayerData(publicKey);
        if (!player || player.stakedAmount === 0) {
            toast.error("No rewards available to claim");
            return;
        }

        await handleTransaction(
            () => program.methods
                .claimRewards()
                .accounts({ authority, player: publicKey as PublicKey })
                .rpc(),
            "Claiming rewards...",
            "Rewards Claimed Successfully!",
            "Failed to Claim Rewards"
        );
    }, [publicKey, getPlayerData, program, handleTransaction]);

    // Effects
    useEffect(() => {
        refreshBalances();
    }, [publicKey, connection, refreshBalances]);

    return (
        <div className="main">
            <div className="main__block">
                <p className="main__block-title">{STAKE_NAME} Staking</p>
                <div className="main__block-balance">
                    <p className="main__block-balance-sub">
                        Balance &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                        {balance.toFixed(4)} {STAKE_NAME}
                    </p>
                    <p className="main__block-balance-sub">
                        Staked Balance {stakedAmount.toFixed(4)} {STAKE_NAME}
                    </p>
                </div>

                <div className="main__block-stake-block">
                    <p className="main__block-stake-block--title">Stake Amount</p>
                    <div className="main__block-stake-block--input-gr">
                        <input 
                            className="main__block-stake-block--input" 
                            value={stakeAmount} 
                            step="0.01" 
                            type="number" 
                            onChange={handleStakeAmountChange}
                        /> 
                        {STAKE_NAME}
                    </div>
                </div>

                <div className="main__block-duration-block">
                    <p className="main__block-stake-block--title">Duration</p>
                    <div className="main__block-duration-block--buttons">
                        {buttons.map(button => (
                            <button
                                key={button.id}
                                onClick={() => handleDurationChange(button.id)}
                                className={`main__block-duration-block--buttons-btn ${button.isActive ? 'active' : ''}`}
                            >
                                {button.durName}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="main_create-account" />
                <button 
                    className="main__block-stake-btn" 
                    onClick={stake}
                    disabled={loading}
                >
                    Stake {STAKE_NAME}
                </button>

                <div className="main_create-account" />
                <button 
                    className="main__block-stake-btn" 
                    onClick={unstake}
                    disabled={loading}
                >
                    UnStake {STAKE_NAME}
                </button>
            </div>

            <div className="main__block">
                <p className="main__block-title">Portfolio</p>
                <div className="main__block-portfolio-blocks">
                    <div className="main__block-portfolio-block">
                        <div className="block-info main__block-portfolio-block--stake-info">
                            <p className="main__block-portfolio-block--stake-info-title">
                                Stake Amount / Duration
                            </p>
                            <p className="main__block-portfolio-block--stake-info-data">
                                {stakedAmount} {STAKE_NAME} / {(stakedDuration || 0) / 86400} days
                            </p>
                        </div>

                        <div className="block-info main__block-portfolio-block--remaining-info">
                            <p className="main__block-portfolio-block--stake-info-title">
                                Staking Time
                            </p>
                            <p className="main__block-portfolio-block--stake-info-data">
                                {new Date(Number(stakeTime) * 1000).toLocaleString()}
                            </p>
                        </div>

                        <div className="block-info main__block-portfolio-block--apy-info">
                            <p className="main__block-portfolio-block--stake-info-title">APY</p>
                            <p className="main__block-portfolio-block--stake-info-data">50%</p>
                        </div>

                        <div className="block-info main__block-portfolio-block--reward-info">
                            <p className="main__block-portfolio-block--stake-info-title">Reward</p>
                            <p className="main__block-portfolio-block--stake-info-data">
                                +{rewardAmount.toFixed(4)} {STAKE_NAME}
                            </p>
                        </div>

                        <button 
                            className="btn get-reward-btn" 
                            onClick={claimRewards}
                            disabled={loading}
                        >
                            Get Reward
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

