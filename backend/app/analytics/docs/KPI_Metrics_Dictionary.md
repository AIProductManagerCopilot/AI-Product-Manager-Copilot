# Analytics Engine: KPI Metrics Dictionary  
**Module Context:** Analytics Module (`/api/v1/analytics/*`)  

---

## 1. Domain 1: Customer Sentiment & Feedback Engine

### 1. Net Promoter Score (NPS)
* **Definition:** Gauges overall customer satisfaction and loyalty based on user rating scale (0–10).
* **Formula:**  
  $$\text{NPS} = \left( \frac{\text{Promoters} - \text{Detractors}}{\text{Total Responses}} \right) \times 100$$
* **Classification:**
  * **Promoters:** Rating 9–10
  * **Passives:** Rating 7–8
  * **Detractors:** Rating 0–6

### 2. Weighted Sentiment Score
* **Definition:** Measures qualitative feedback sentiment adjusted by ticket/issue severity weight.
* **Formula:**  
  $$\text{Weighted Sentiment} = \frac{\sum (\text{Severity Weight} \times \text{Sentiment Score})}{\sum \text{Severity Weight}}$$
* **Severity Scale:**
  * `Critical`: 3.0
  * `High`: 2.0
  * `Medium`: 1.5
  * `Low`: 1.0

---

## 2. Domain 2: Agile Engineering Velocity Engine

### 1. Actual Sprint Velocity
* **Definition:** Total story points completed within a single closed sprint.
* **Metric Type:** Absolute Numeric Value (Points).

### 2. Point Predictability Rate (%)
* **Definition:** The ratio of delivered story points relative to original sprint commitments.
* **Formula:**  
  $$\text{Predictability Rate (\%)} = \left( \frac{\text{Completed Story Points}}{\text{Planned Story Points}} \right) \times 100$$

### 3. Scope Creep Percentage (%)
* **Definition:** Percentage of story points added to a sprint after its official start date.
* **Formula:**  
  $$\text{Scope Creep (\%)} = \left( \frac{\text{Story Points Added Post-Start}}{\text{Planned Story Points}} \right) \times 100$$

---

## 3. Domain 3: Delivery Lead Time & Ticket Aging Engine

### 1. Average Lead Time (Days)
* **Definition:** Calendar days elapsed from ticket creation to ticket resolution/closure.
* **Formula:**  
  $$\text{Avg Lead Time} = \text{AVG}(\text{resolved\_at} - \text{created\_at})$$

### 2. Average Cycle Time (Days)
* **Definition:** Calendar days elapsed from when work actively began (`started_at`) to completion (`resolved_at`).
* **Formula:**  
  $$\text{Avg Cycle Time} = \text{AVG}(\text{resolved\_at} - \text{started\_at})$$

### 3. Backlog Stagnation Rate (%)
* **Definition:** Percentage of unresolved/open tickets that have remained open for longer than 30 days.
* **Formula:**  
  $$\text{Stagnation Rate (\%)} = \left( \frac{\text{Open Tickets } > 30 \text{ Days}}{\text{Total Open Tickets}} \right) \times 100$$