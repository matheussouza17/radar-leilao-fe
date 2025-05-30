'use client'

import { useRegisterClient } from '@/contexts/RegisterClientContext'
import { loginClient } from '@/services/authService'
import { acceptTerms, getCurrentTerms } from '@/services/termsService'
import { toast } from 'react-toastify'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { updateClientUser, updateClient } from '@/services/clientService'
import { useAuthContext } from '@/contexts/AuthContext'

interface StepThreePlansProps {
  onBack: () => void
}

const plans = [
  { name: 'Starter', price: 'Grátis', features: ['1 usuário', 'Sem suporte'] , isTrial: true},
  { name: 'Essencial', price: 'R$ 49/mês', features: ['5 usuários', 'Suporte por e-mail'], isTrial: false },
  { name: 'Profissional', price: 'R$ 149/mês', features: ['10 usuários', 'Suporte rápido'], isTrial: false },
  { name: 'Enterprise', price: 'R$ 499/mês', features: ['Ilimitado', 'Suporte dedicado'], isTrial: false },
]

export default function StepFourPlans({ onBack }: StepThreePlansProps) {
  const { formData } = useRegisterClient()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<{ name: string; isTrial: boolean } | null>(null) 
  const { login } = useAuthContext()

  async function handleFinish() {
    await updateClientUser(formData.clientUserId, formData.companyName, formData.email, formData.cpfCnpj, formData.phone, formData.password)
    await updateClient(formData.clientId, formData.companyName, formData.cpfCnpj)
    
    if (!selectedPlan) {
      toast.error('Selecione um plano para continuar.')
      return
    }

    if (!formData.acceptTerms) {
      toast.error('Você precisa aceitar os termos.')
      return
    }

    setLoading(true)
    try {
      const currentTerms = await getCurrentTerms()

      if (!currentTerms) {
        toast.error('Nenhum termo de uso disponível.')
        return
      }
      await acceptTerms({
        clientUserId: formData.clientUserId!,
        termsId: currentTerms.id,
      })

      const token = await loginClient({
        login: formData.email,
        password: formData.password,
        context: 'CLIENT',
      })
      localStorage.setItem('clientToken', token)
      login(token, 'CLIENT') 

      toast.success('Conta criada com sucesso!')
      router.push('/dashboard-client')
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao concluir o cadastro.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {plans.map((plan) => (
          <button
            key={plan.name}
            type="button"
            onClick={() => setSelectedPlan({ name: plan.name, isTrial: plan.isTrial })}
            className={`border rounded-lg p-4 text-left shadow-sm transition ${
              selectedPlan?.name === plan.name
                ? 'border-yellow-500 bg-yellow-100'
                : 'border-black-300'
            }`}
          >
            <h3 className="text-lg font-bold mb-1">{plan.name}</h3>
            <p className="text-yellow-600 font-medium">{plan.price}</p>
            <ul className="mt-2 text-sm text-gray-600 list-disc list-inside">
              {plan.features.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
          </button>
        ))}
      </div>

      <div className="flex justify-between mt-6">
        <button
          onClick={onBack}
          className="text-sm text-gray-600 hover:underline"
        >
          Voltar
        </button>
        <button
          onClick={handleFinish}
          disabled={!selectedPlan || loading}
          className={`px-4 py-2 rounded transition ${
            selectedPlan
              ? 'bg-yellow-400 text-black hover:bg-yellow-300'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {loading
          ? 'Finalizando...'
          : selectedPlan?.isTrial
            ? 'Concluir'
            : 'Avançar'}

        </button>
      </div>
    </div>
  )
}
