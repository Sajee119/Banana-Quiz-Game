import bananaLogo from '../assets/banana-logo.jpg';

export default function BananaLogo({ size = 60, className = '', style, ...rest }) {
    return (
        <img
            src={bananaLogo}
            width={size}
            height={size}
            className={className}
            style={style}
            role="img"
            aria-label="Banana Quiz"
            alt="Banana Quiz"
            {...rest}
        />
    );
}
