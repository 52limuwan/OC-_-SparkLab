import FeishuIcon from '../../components/FeishuIcon';
import { AnimatedCharacters } from '../../components/AnimatedCharacters';
import { Button, Form, Input, message } from 'antd';
import { useState } from 'react';
import {
    EyeInvisibleOutlined,
    EyeOutlined,
    LockOutlined,
    UserOutlined,
} from '@ant-design/icons';

import styles from './index.module.css';

/** 模拟登录 API（仅前端逻辑，无真实请求） */
async function mockLogin(_values: { username: string; password: string }) {
    await new Promise((resolve) => setTimeout(resolve, 800));
    return { data: { access_token: 'mock_token_' + Date.now() } };
}

export default function Login() {
    const [loading, setLoading] = useState(false);
    const [form] = Form.useForm();
    const [showPassword, setShowPassword] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [passwordValue, setPasswordValue] = useState('');
    const [error, setError] = useState('');

    const handleLogin = async (values: { username: string; password: string }) => {
        setLoading(true);
        setError('');
        try {
            const { data } = await mockLogin(values);
            localStorage.setItem('access_token', data.access_token);
            message.success('登录成功');
            setTimeout(() => {
                window.location.href = '/';
            }, 500);
        } catch {
            setError('账号或密码有误，请重新输入');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            {/* 左侧：品牌视觉区 */}
            <div className={styles.leftPanel}>
                <div className={styles.leftTop}>
                    <div className={styles.brandMark}>
                        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                            <rect
                                width="28"
                                height="28"
                                rx="7"
                                fill="white"
                                fillOpacity="0.15"
                            />
                            <path
                                d="M7 14L12 9L17 14L12 19L7 14Z"
                                fill="white"
                                fillOpacity="0.9"
                            />
                            <path
                                d="M13 14L18 9L21 12V16L18 19L13 14Z"
                                fill="white"
                                fillOpacity="0.5"
                            />
                        </svg>
                    </div>
                    <span className={styles.brandName}>Nexus</span>
                </div>

                <div className={styles.charactersArea}>
                    <AnimatedCharacters
                        isTyping={isTyping}
                        showPassword={showPassword}
                        passwordLength={passwordValue.length}
                    />
                </div>

                <div className={styles.leftFooter}>
                    <a href="#">帮助中心</a>
                    <a href="#">隐私政策</a>
                </div>

                <div className={styles.decorBlur1} />
                <div className={styles.decorBlur2} />
                <div className={styles.decorGrid} />
            </div>

            {/* 右侧：登录表单 */}
            <div className={styles.rightPanel}>
                <div className={styles.formWrapper}>
                    <div className={styles.mobileLogo}>
                        <div className={styles.mobileLogoIcon}>
                            <svg width="20" height="20" viewBox="0 0 28 28" fill="none">
                                <path
                                    d="M7 14L12 9L17 14L12 19L7 14Z"
                                    fill="#1E40AF"
                                    fillOpacity="0.9"
                                />
                                <path
                                    d="M13 14L18 9L21 12V16L18 19L13 14Z"
                                    fill="#3B82F6"
                                    fillOpacity="0.7"
                                />
                            </svg>
                        </div>
                        <span>Nexus 平台</span>
                    </div>

                    <div className={styles.formHeader}>
                        <h1 className={styles.formTitle}>登录到工作台</h1>
                        <p className={styles.formSubtitle}>
                            统一接入前端平台旗下所有系统
                        </p>
                    </div>

                    <Form
                        form={form}
                        name="login"
                        onFinish={handleLogin}
                        autoComplete="off"
                        size="large"
                        className={styles.form}
                    >
                        <div className={styles.fieldLabel}>账号</div>
                        <Form.Item
                            name="username"
                            rules={[
                                { required: true, message: '请输入账号' },
                                { min: 3, message: '账号长度不能少于3个字符' },
                            ]}
                        >
                            <Input
                                prefix={
                                    <UserOutlined className={styles.prefixIcon} />
                                }
                                placeholder="输入您的账号"
                                onFocus={() => setIsTyping(true)}
                                onBlur={() => setIsTyping(false)}
                            />
                        </Form.Item>

                        <div className={styles.fieldLabel}>密码</div>
                        <Form.Item
                            name="password"
                            rules={[
                                { required: true, message: '请输入密码' },
                                { min: 6, message: '密码长度不能少于6个字符' },
                            ]}
                        >
                            <Input
                                prefix={
                                    <LockOutlined className={styles.prefixIcon} />
                                }
                                type={showPassword ? 'text' : 'password'}
                                placeholder="输入您的密码"
                                onChange={(e) =>
                                    setPasswordValue(e.target.value)
                                }
                                suffix={
                                    <span
                                        className={styles.eyeToggle}
                                        onClick={() =>
                                            setShowPassword(!showPassword)
                                        }
                                    >
                                        {showPassword ? (
                                            <EyeOutlined />
                                        ) : (
                                            <EyeInvisibleOutlined />
                                        )}
                                    </span>
                                }
                            />
                        </Form.Item>

                        {error && (
                            <div className={styles.errorBox}>{error}</div>
                        )}

                        <Form.Item style={{ marginBottom: 0 }}>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={loading}
                                block
                                className={styles.submitBtn}
                            >
                                {loading ? '登录中...' : '登录'}
                            </Button>
                        </Form.Item>
                    </Form>

                    <div className={styles.divider}>
                        <span>或</span>
                    </div>

                    <Button
                        block
                        icon={<FeishuIcon type="icon-feishu" />}
                        className={styles.googleBtn}
                    >
                        飞书账号一键登录
                    </Button>

                    <div className={styles.signupRow}>
                        暂无账号？{' '}
                        <a href="#" className={styles.signupLink}>
                            联系管理员申请开通
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
