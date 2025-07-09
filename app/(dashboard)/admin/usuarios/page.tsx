import { UserApprovalClientPage } from "@/components/pages/user-approval-client-page";

export default function AprovacaoAcessoPage() {
    // Aqui você pode adicionar lógica de proteção para garantir que só admins vejam a página,
    // mas o nosso layout do dashboard já faz isso.
    return (
        <UserApprovalClientPage />
    );
}