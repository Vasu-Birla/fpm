<!-- Header Start -->
    <?php include('header.php'); ?>
<!-- Header End -->

<!-- Sidebar Start -->
    <?php include('sidebar.php'); ?>
<!-- Sidebar End -->

<!-- ========================
    Start Page Content
========================= -->
    
<div class="page-wrapper">

    <!-- Start Content -->
    <div class="content">

        <!-- Start Page Header -->
        <div class="d-flex align-items-sm-center flex-sm-row flex-column gap-2 pb-3 mb-3 border-1 border-bottom">
            <div class="flex-grow-1">
                <h4 class="fw-bold mb-0">🔸 Billing & Invoices <span class="badge badge-soft-primary fw-medium border py-1 px-2 border-primary fs-13 ms-1">Manage pricing tiers, transactions, and auto-renewals.</span></h4>
            </div>
            <div class="text-end d-flex">
            </div>
        </div>
        <!-- End Page Header -->

        <!-- Filters -->
        <div class="card mb-4 shadow-sm border">
            <div class="card-body">
                <form method="POST" class="row g-3">
                    <div class="col-md-3">
                        <label for="invoice_no" class="form-label">Invoice No.</label>
                        <input type="text" id="invoice_no" name="invoice_no" class="form-control" placeholder="Enter the invoice number">
                    </div>
                    <div class="col-md-3">
                        <label for="transaction_id" class="form-label">Transaction ID</label>
                        <input type="text" id="transaction_id" name="transaction_id" class="form-control" placeholder="Enter the transaction id">
                    </div>
                    <div class="col-md-3">
                        <label for="date" class="form-label">Date</label>
                        <input type="date" id="date" name="date" class="form-control" name="filter_date">
                    </div>
                    <div class="col-md-3">
                        <label for="filter_status" class="form-label">Status</label>
                        <select class="form-select select2" id="filter_status" name="filter_status">
                            <option value="">All</option>
                            <option value="paid">Paid</option>
                            <option value="pending">Pending</option>
                            <option value="disputed">Disputed</option>
                        </select>
                    </div>
                    <div class="col-md-5"></div>
                    <div class="col-md-2">
                        <button type="submit" name="submit" id="submit" class="btn btn-primary btn-md fs-13 fw-medium rounded">Submit</button>
                    </div>
                    <div class="col-md-5"></div>
                </form>
            </div>
        </div>

        <!-- Tabs -->
        <ul class="nav nav-tabs mb-3" id="invoiceTab" role="tablist">
            <li class="nav-item">
                <a class="nav-link active" id="booking-invoices-tab" data-bs-toggle="tab" href="#booking-invoices" role="tab">Transaction Logs</a>
            </li>
            <!-- <li class="nav-item">
                <a class="nav-link" id="custom-invoice-tab" data-bs-toggle="tab" href="#custom-invoice" role="tab">Payment Gateway Keys</a>
            </li> -->
        </ul>

        <!-- Tab Contents -->
        <div class="tab-content" id="invoiceTabContent">

            <!-- Booking Invoices -->
            <div class="tab-pane fade show active" id="booking-invoices" role="tabpanel">
                <div class="card shadow-sm border">
                    <div class="card-body table-responsive">
                        <table class="table table-bordered">
                            <thead class="table-light">
                                <tr>
                                    <th># Invoice No.</th>
                                    <th>Customer Name</th>
                                    <th>Transaction ID</th>
                                    <th>Amount</th>
                                    <th>Date</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                    <!-- <th>Download</th> -->
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>1</td>
                                    <td>Ram Kumar</td>
                                    <td>TXN123456</td>
                                    <td>$20</td>
                                    <td>2025-08-01</td>
                                    <td><span class="badge bg-success">Paid</span></td>
                                    <td><a href="#invoice-pdf.php" target="_blank" class="btn btn-sm btn-primary">PDF</a></td>
                                </tr>
                                <tr>
                                    <td>2</td>
                                    <td>Doctor</td>
                                    <td>TXN789012</td>
                                    <td>$50</td>
                                    <td>2025-07-01</td>
                                    <td><span class="badge bg-success">Paid</span></td>
                                    <td><a href="#invoice-pdf.php" target="_blank" class="btn btn-sm btn-primary">PDF</a></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- Custom Invoice -->
            <div class="tab-pane fade" id="custom-invoice" role="tabpanel">
                <div class="card shadow-sm border">
                    <div class="card-body">
                        <form>
                            <div class="mb-3">
                                <label for="stripe_key" class="form-label">Stripe API Key</label>
                                <input type="text" id="stripe_key" name="stripe_key" class="form-control" placeholder="Enter Stripe API Key">
                            </div>
                            <div class="mb-3">
                                <label for="paypal_id" class="form-label">PayPal Client ID</label>
                                <input type="text" id="paypal_id" name="paypal_id" class="form-control" placeholder="Enter PayPal Client ID">
                            </div>
                            <button name="submit" id="submit" class="btn btn-primary">Save Keys</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
        
    </div>
    <!-- End Content -->

</div>

<!-- ========================
    End Page Content
========================= -->

<!-- Footer Start -->
    <?php include ('footer.php'); ?>
<!-- Footer End -->