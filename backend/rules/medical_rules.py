def filter_herbs_by_medical_condition(candidate_herbs, medical_records):
    if not medical_records:
        return candidate_herbs

    safe_herbs = []
    patient_conditions_text = " ".join([
        f"{r.get('diagnosis', '')} {r.get('symptoms', '')} {r.get('notes', '')}"
        for r in medical_records
    ]).lower()
    
    for herb in candidate_herbs:
        kontraindikasi = herb.get('kontraindikasi', '').lower()
        import re
        words = re.findall(r'\b\w+\b', kontraindikasi)
        
        is_safe = True
        critical_keywords = ['hipertensi', 'hipotensi', 'diabetes', 'hamil', 'menyusui', 'maag', 'asam lambung', 'ginjal', 'jantung', 'liver']
        
        for kw in critical_keywords:
            if kw in kontraindikasi and kw in patient_conditions_text:
                is_safe = False
                break
                
        if is_safe:
            safe_herbs.append(herb)
            
    return safe_herbs
